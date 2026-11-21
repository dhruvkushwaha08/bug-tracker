
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Bug,
  Users,
  Settings,
  Search,
  Bell,
  Plus,
  MoreHorizontal,
  Menu,
  X,
  CircleDashed,
  LoaderCircle,
  CircleCheck,
  Wrench,
  Sparkles,
  Trash2,
  LogOut,
  CalendarDays,
  ArrowRight,
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../App.css";

const STATUSES = ["Todo", "In progress", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];
const TYPES = ["Bug", "Task", "Feature"];

const STATUS_TO_API = {
  Todo: "TODO",
  "In progress": "IN_PROGRESS",
  Done: "DONE",
};

const API_TO_STATUS = {
  TODO: "Todo",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

const STATUS_ICON = {
  Todo: CircleDashed,
  "In progress": LoaderCircle,
  Done: CircleCheck,
};

const TYPE_ICON = {
  Bug,
  Task: Wrench,
  Feature: Sparkles,
};

const slug = (value = "") =>
  value.toLowerCase().replace(/\s+/g, "-");

function initials(name) {
  if (!name) return "—";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function mapIssue(issue, projectKey) {
  const number = String(issue.id).padStart(3, "0");

  return {
    backendId: issue.id,
    id: `${projectKey || "ISSUE"}-${number}`,
    title: issue.title,
    description: issue.description || "",
    type: issue.type
      ? issue.type.charAt(0) + issue.type.slice(1).toLowerCase()
      : "Bug",
    priority: issue.priority
      ? issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase()
      : "Medium",
    status: API_TO_STATUS[issue.status] || "Todo",
    assignee: initials(issue.assigneeName),
    assigneeName: issue.assigneeName || "",
    assigneeId: issue.assigneeId || null,
    projectId: issue.projectId,
    dueDate: issue.dueDate || null,
  };
}

function PriorityMark({ level }) {
  const priority = PRIORITIES.includes(level) ? level : "Medium";
  const count = PRIORITIES.indexOf(priority) + 1;

  return (
    <span
      className={`priority priority-${slug(priority)}`}
      title={`${priority} priority`}
    >
      <span className="priority-bars" aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <i key={item} className={item <= count ? "on" : ""} />
        ))}
      </span>
      {priority}
    </span>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);

  const [activeView, setActiveView] = useState("overview");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [savingIssue, setSavingIssue] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [error, setError] = useState("");

  const issueDialogRef = useRef(null);
  const projectDialogRef = useRef(null);
  const searchRef = useRef(null);

  const projectKey =
    selectedProject?.projectKey || selectedProject?.key || "ISSUE";

  // Load projects and team members.
  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoadingProjects(true);
      setError("");

      try {
        const [projectResult, userResult] = await Promise.allSettled([
          api.get("/projects"),
          api.get("/users"),
        ]);

        if (!active) return;

        if (projectResult.status === "rejected") {
          throw projectResult.reason;
        }

        const projectData = projectResult.value.data || [];

        setProjects(projectData);

        if (projectData.length > 0) {
          setSelectedProject(projectData[0]);
        }

        if (userResult.status === "fulfilled") {
          setUsers(userResult.value.data || []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load dashboard data. Please try again."
          );
        }
      } finally {
        if (active) setLoadingProjects(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  // Load issues whenever the selected project changes.
  useEffect(() => {
    if (!selectedProject?.id) {
      setIssues([]);
      return;
    }

    let active = true;

    async function loadIssues() {
      setLoadingIssues(true);
      setError("");

      try {
        const response = await api.get(
          `/issues/project/${selectedProject.id}`
        );

        if (active) {
          setIssues(
            (response.data || []).map((issue) =>
              mapIssue(
                issue,
                selectedProject.projectKey || selectedProject.key
              )
            )
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load issues. Please try again."
          );
        }
      } finally {
        if (active) setLoadingIssues(false);
      }
    }

    loadIssues();

    return () => {
      active = false;
    };
  }, [selectedProject]);

  // Keyboard shortcut for search.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === "Escape") {
        setNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const counts = useMemo(() => {
    const result = Object.fromEntries(
      STATUSES.map((status) => [status, 0])
    );

    issues.forEach((issue) => {
      if (result[issue.status] !== undefined) {
        result[issue.status] += 1;
      }
    });

    return result;
  }, [issues]);

  const total = issues.length;
  const donePct = total
    ? Math.round((counts.Done / total) * 100)
    : 0;

  const urgent = issues.filter(
    (issue) =>
      issue.priority === "High" && issue.status !== "Done"
  );

  const visibleIssues = issues.filter((issue) => {
    const matchesFilter =
      filter === "All" || issue.status === filter;

    const search = query.trim().toLowerCase();

    const matchesSearch =
      !search ||
      `${issue.title} ${issue.id} ${issue.description}`
        .toLowerCase()
        .includes(search);

    return matchesFilter && matchesSearch;
  });

  const filters = [
    ["All", "All issues", total],
    ...STATUSES.map((status) => [
      status,
      status,
      counts[status],
    ]),
  ];

  // Change issue status.
  const cycleStatus = async (issue) => {
    const nextStatus =
      STATUSES[
        (STATUSES.indexOf(issue.status) + 1) % STATUSES.length
      ];

    const request = {
      projectId: issue.projectId,
      title: issue.title,
      description: issue.description,
      type: issue.type.toUpperCase(),
      priority: issue.priority.toUpperCase(),
      status: STATUS_TO_API[nextStatus],
      assigneeId: issue.assigneeId,
      dueDate: issue.dueDate,
    };

    setError("");

    try {
      await api.put(`/issues/${issue.backendId}`, request);

      setIssues((current) =>
        current.map((item) =>
          item.backendId === issue.backendId
            ? { ...item, status: nextStatus }
            : item
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update issue status."
      );
    }
  };

  // Create a project.
  const createProject = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const request = {
      name: String(data.get("name") || "").trim(),
      projectKey: String(data.get("projectKey") || "")
        .trim()
        .toUpperCase(),
      description: String(data.get("description") || "").trim(),
    };

    if (!request.name || !request.projectKey) return;

    setSavingProject(true);
    setError("");

    try {
      const response = await api.post("/projects", request);
      const newProject = response.data;

      setProjects((current) => [...current, newProject]);
      setSelectedProject(newProject);
      setFilter("All");
      setQuery("");
      setActiveView("overview");

      form.reset();
      projectDialogRef.current?.close();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create project. Check the project key and try again."
      );
    } finally {
      setSavingProject(false);
    }
  };

  // Create an issue.
  const createIssue = async (event) => {
    event.preventDefault();

    if (!selectedProject) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();

    if (!title) return;

    const request = {
      projectId: selectedProject.id,
      title,
      description: String(data.get("description") || "").trim(),
      type: String(data.get("type") || "Bug").toUpperCase(),
      priority: String(data.get("priority") || "Medium").toUpperCase(),
      status: "TODO",
      assigneeId: data.get("assigneeId")
        ? Number(data.get("assigneeId"))
        : null,
    };

    setSavingIssue(true);
    setError("");

    try {
      const response = await api.post("/issues", request);

      const newIssue = mapIssue(response.data, projectKey);

      setIssues((current) => [newIssue, ...current]);
      setFilter("All");
      setActiveView("issues");

      form.reset();
      issueDialogRef.current?.close();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create issue. Please try again."
      );
    } finally {
      setSavingIssue(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const changeView = (view) => {
    setActiveView(view);
    setNavOpen(false);
    setError("");
  };

  const openProject = (project) => {
    setSelectedProject(project);
    setActiveView("overview");
    setFilter("All");
    setQuery("");
    setNavOpen(false);
  };

  const displayName = user?.fullName || "User";

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Trackly

          <button
            className="icon-button close-nav"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace">
          <span className="workspace-avatar">T</span>
          <span className="workspace-info">
            <strong>Trackly</strong>
            <small>Issue workspace</small>
          </span>
        </div>

        <nav className="navigation" aria-label="Main navigation">
          <button
            className={`nav-item ${
              activeView === "overview" ? "active" : ""
            }`}
            onClick={() => changeView("overview")}
          >
            <LayoutDashboard size={17} />
            Overview
          </button>

          <button
            className={`nav-item ${
              activeView === "projects" ? "active" : ""
            }`}
            onClick={() => changeView("projects")}
          >
            <FolderKanban size={17} />
            Projects
            <span className="nav-count">{projects.length}</span>
          </button>

          <button
            className={`nav-item ${
              activeView === "issues" ? "active" : ""
            }`}
            onClick={() => changeView("issues")}
          >
            <Bug size={17} />
            Issues
            <span className="nav-count">{total}</span>
          </button>

          <button
            className={`nav-item ${
              activeView === "team" ? "active" : ""
            }`}
            onClick={() => changeView("team")}
          >
            <Users size={17} />
            Team
            <span className="nav-count">{users.length}</span>
          </button>
        </nav>

        <p className="nav-label">Your projects</p>

        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className="project-link"
            onClick={() => openProject(project)}
            style={{
              width: "100%",
              border: 0,
              textAlign: "left",
              cursor: "pointer",
              background:
                selectedProject?.id === project.id
                  ? "rgba(0,0,0,0.05)"
                  : "transparent",
            }}
          >
            <span className="project-swatch" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {project.name}
            </span>
          </button>
        ))}

        <button
          type="button"
          className="project-link"
          onClick={() => projectDialogRef.current?.showModal()}
        >
          <Plus size={15} />
          Create project
        </button>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${
              activeView === "settings" ? "active" : ""
            }`}
            onClick={() => changeView("settings")}
          >
            <Settings size={17} />
            Settings
          </button>

          <div className="profile">
            <span className="avatar">{initials(displayName)}</span>

            <span className="profile-info">
              <strong>{displayName}</strong>
              <small>{user?.role || "Member"}</small>
            </span>

            <button
              className="icon-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={handleLogout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {navOpen && (
        <div
          className="scrim"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <label className="search">
            <Search size={16} />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search issues"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd>Ctrl K</kbd>
          </label>

          <button
            className="icon-button bell"
            aria-label="Notifications"
            title="Notifications"
            type="button"
          >
            <Bell size={18} />
          </button>
        </header>

        <div className="page-content">
          {error && (
            <div
              role="alert"
              style={{
                padding: "12px 16px",
                marginBottom: 18,
                borderRadius: 8,
                background: "#fff0f0",
                color: "#b42318",
              }}
            >
              {error}
            </div>
          )}

          {loadingProjects ? (
            <div className="empty">Loading your workspace...</div>
          ) : (
            <>
              {/* OVERVIEW */}
              {activeView === "overview" && (
                <>
                  <section className="welcome">
                    <div>
                      <h1>
                        {greeting()}, {displayName.split(" ")[0]}
                      </h1>
                      <p>
                        {urgent.length > 0
                          ? `${urgent.length} high-priority ${
                              urgent.length === 1 ? "issue is" : "issues are"
                            } still open.`
                          : "Nothing urgent is open right now."}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="ghost-button"
                        onClick={() =>
                          projectDialogRef.current?.showModal()
                        }
                      >
                        <Plus size={16} />
                        Project
                      </button>

                      <button
                        className="primary-button"
                        disabled={!selectedProject}
                        onClick={() =>
                          issueDialogRef.current?.showModal()
                        }
                      >
                        <Plus size={17} />
                        New issue
                      </button>
                    </div>
                  </section>

                  {!selectedProject ? (
                    <EmptyState
                      title="Welcome to Trackly!"
                      description="Create your first project to start managing bugs, tasks and features."
                      action={
                        <button
                          className="primary-button"
                          style={{ marginTop: 18 }}
                          onClick={() =>
                            projectDialogRef.current?.showModal()
                          }
                        >
                          <Plus size={16} />
                          Create your first project
                        </button>
                      }
                    />
                  ) : (
                    <>
                      <section className="progress-band">
                        <div className="progress-head">
                          <div>
                            <h2>{selectedProject.name}</h2>
                            <p>
                              {selectedProject.projectKey} · {counts.Done} of{" "}
                              {total} issues completed
                            </p>
                          </div>

                          <span className="progress-pct">
                            {donePct}%
                          </span>
                        </div>

                        <div className="segments">
                          {STATUSES.map((status) => (
                            <span
                              key={status}
                              className={`segment seg-${slug(status)}`}
                              style={{
                                flexGrow: counts[status] || 0.001,
                              }}
                            />
                          ))}
                        </div>

                        <ul className="legend">
                          {STATUSES.map((status) => (
                            <li key={status}>
                              <span className={`dot dot-${slug(status)}`} />
                              {status}
                              <strong>{counts[status]}</strong>
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section className="issues" id="issues">
                        <div className="issues-head">
                          <h2>Recent issues</h2>

                          <button
                            className="ghost-button"
                            onClick={() => changeView("issues")}
                          >
                            View all <ArrowRight size={15} />
                          </button>
                        </div>

                        {loadingIssues ? (
                          <div className="empty">Loading issues...</div>
                        ) : visibleIssues.length === 0 ? (
                          <EmptyState
                            title="No issues found"
                            description={
                              total === 0
                                ? "Create your first issue to get started."
                                : "Try changing your search or filters."
                            }
                            action={
                              <button
                                className="primary-button"
                                style={{ marginTop: 16 }}
                                onClick={() =>
                                  issueDialogRef.current?.showModal()
                                }
                              >
                                <Plus size={16} />
                                New issue
                              </button>
                            }
                          />
                        ) : (
                          <ul className="issue-list">
                            {visibleIssues.slice(0, 5).map((issue) => {
                              const TypeIcon =
                                TYPE_ICON[issue.type] || Bug;
                              const StatusIcon =
                                STATUS_ICON[issue.status] || CircleDashed;

                              return (
                                <li
                                  className="issue-row"
                                  key={issue.backendId}
                                >
                                  <button
                                    className={`status status-${slug(
                                      issue.status
                                    )}`}
                                    onClick={() => cycleStatus(issue)}
                                    title="Click to change status"
                                  >
                                    <StatusIcon size={16} />
                                    {issue.status}
                                  </button>

                                  <div className="issue-main">
                                    <strong>{issue.title}</strong>
                                    <span className="issue-meta">
                                      <span className="issue-id">
                                        {issue.id}
                                      </span>
                                      <span className="issue-type">
                                        <TypeIcon size={13} />
                                        {issue.type}
                                      </span>
                                    </span>
                                  </div>

                                  <PriorityMark level={issue.priority} />

                                  <span
                                    className="avatar small"
                                    title={
                                      issue.assigneeName || "Unassigned"
                                    }
                                  >
                                    {issue.assignee}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </section>
                    </>
                  )}
                </>
              )}

              {/* PROJECTS */}
              {activeView === "projects" && (
                <>
                  <section className="welcome">
                    <div>
                      <h1>Projects</h1>
                      <p>Manage all your projects in one place.</p>
                    </div>

                    <button
                      className="primary-button"
                      onClick={() =>
                        projectDialogRef.current?.showModal()
                      }
                    >
                      <Plus size={17} />
                      New project
                    </button>
                  </section>

                  {projects.length === 0 ? (
                    <EmptyState
                      title="No projects yet"
                      description="Create a project to start organizing your work."
                      action={
                        <button
                          className="primary-button"
                          style={{ marginTop: 16 }}
                          onClick={() =>
                            projectDialogRef.current?.showModal()
                          }
                        >
                          <Plus size={16} />
                          Create project
                        </button>
                      }
                    />
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => openProject(project)}
                          style={{
                            textAlign: "left",
                            padding: 20,
                            border: "1px solid var(--line)",
                            borderRadius: 10,
                            background: "var(--surface)",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 16,
                            }}
                          >
                            <span className="project-swatch" />
                            <ArrowRight size={17} />
                          </div>

                          <h2
                            style={{
                              font: "600 18px var(--display)",
                              marginBottom: 5,
                            }}
                          >
                            {project.name}
                          </h2>

                          <p
                            style={{
                              color: "var(--ink-3)",
                              fontSize: 13,
                            }}
                          >
                            {project.projectKey}
                          </p>

                          <p
                            style={{
                              marginTop: 12,
                              color: "var(--ink-2)",
                            }}
                          >
                            {project.description ||
                              "No project description."}
                          </p>

                          <p
                            style={{
                              marginTop: 16,
                              fontSize: 12,
                              color: "var(--ink-3)",
                            }}
                          >
                            Owner: {project.ownerName || "You"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ISSUES */}
              {activeView === "issues" && (
                <>
                  <section className="welcome">
                    <div>
                      <h1>Issues</h1>
                      <p>
                        {selectedProject
                          ? `Issues in ${selectedProject.name}`
                          : "Select a project to view its issues."}
                      </p>
                    </div>

                    <button
                      className="primary-button"
                      disabled={!selectedProject}
                      onClick={() =>
                        issueDialogRef.current?.showModal()
                      }
                    >
                      <Plus size={17} />
                      New issue
                    </button>
                  </section>

                  {projects.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: 6,
                          color: "var(--ink-2)",
                          fontWeight: 600,
                        }}
                      >
                        Project
                      </label>

                      <select
                        value={selectedProject?.id || ""}
                        onChange={(event) => {
                          const project = projects.find(
                            (item) =>
                              String(item.id) === event.target.value
                          );
                          if (project) openProject(project);
                        }}
                        style={{
                          minWidth: 220,
                          height: 38,
                          padding: "0 10px",
                          border: "1px solid var(--line-strong)",
                          borderRadius: 8,
                          background: "var(--surface)",
                        }}
                      >
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!selectedProject ? (
                    <EmptyState
                      title="No project selected"
                      description="Create a project before adding issues."
                      action={
                        <button
                          className="primary-button"
                          style={{ marginTop: 16 }}
                          onClick={() =>
                            projectDialogRef.current?.showModal()
                          }
                        >
                          <Plus size={16} />
                          Create project
                        </button>
                      }
                    />
                  ) : (
                    <section className="issues">
                      <div className="issues-head">
                        <h2>All issues</h2>

                        <div className="tabs" role="tablist">
                          {filters.map(([value, label, count]) => (
                            <button
                              key={value}
                              role="tab"
                              aria-selected={filter === value}
                              className={
                                filter === value ? "tab active" : "tab"
                              }
                              onClick={() => setFilter(value)}
                            >
                              {label}
                              <span>{count}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {loadingIssues ? (
                        <div className="empty">Loading issues...</div>
                      ) : visibleIssues.length === 0 ? (
                        <EmptyState
                          title="No issues found"
                          description={
                            total === 0
                              ? "Create your first issue in this project."
                              : "Try another status filter or search term."
                          }
                        />
                      ) : (
                        <ul className="issue-list">
                          {visibleIssues.map((issue) => {
                            const TypeIcon =
                              TYPE_ICON[issue.type] || Bug;
                            const StatusIcon =
                              STATUS_ICON[issue.status] || CircleDashed;

                            return (
                              <li
                                className="issue-row"
                                key={issue.backendId}
                              >
                                <button
                                  className={`status status-${slug(
                                    issue.status
                                  )}`}
                                  onClick={() => cycleStatus(issue)}
                                  title="Click to change status"
                                >
                                  <StatusIcon size={16} />
                                  {issue.status}
                                </button>

                                <div className="issue-main">
                                  <strong>{issue.title}</strong>
                                  <span className="issue-meta">
                                    <span className="issue-id">
                                      {issue.id}
                                    </span>
                                    <span className="issue-type">
                                      <TypeIcon size={13} />
                                      {issue.type}
                                    </span>
                                  </span>
                                </div>

                                <PriorityMark level={issue.priority} />

                                <span
                                  className="avatar small"
                                  title={
                                    issue.assigneeName || "Unassigned"
                                  }
                                >
                                  {issue.assignee}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>
                  )}
                </>
              )}

              {/* TEAM */}
              {activeView === "team" && (
                <>
                  <section className="welcome">
                    <div>
                      <h1>Team</h1>
                      <p>People in your Trackly workspace.</p>
                    </div>
                  </section>

                  {users.length === 0 ? (
                    <EmptyState
                      title="No team members found"
                      description="Team member information could not be loaded."
                    />
                  ) : (
                    <div
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        overflow: "hidden",
                      }}
                    >
                      {users.map((member) => (
                        <div
                          key={member.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: 16,
                            borderBottom: "1px solid var(--line)",
                          }}
                        >
                          <span className="avatar">
                            {initials(member.fullName)}
                          </span>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{member.fullName}</strong>
                            <p
                              style={{
                                color: "var(--ink-3)",
                                fontSize: 13,
                              }}
                            >
                              {member.email}
                            </p>
                          </div>

                          <span
                            style={{
                              color: "var(--ink-2)",
                              fontSize: 13,
                            }}
                          >
                            {member.role || "Member"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* SETTINGS */}
              {activeView === "settings" && (
                <>
                  <section className="welcome">
                    <div>
                      <h1>Settings</h1>
                      <p>Your account information.</p>
                    </div>
                  </section>

                  <div
                    style={{
                      maxWidth: 560,
                      padding: 22,
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 24,
                      }}
                    >
                      <span
                        className="avatar"
                        style={{ width: 48, height: 48, fontSize: 16 }}
                      >
                        {initials(displayName)}
                      </span>

                      <div>
                        <h2 style={{ font: "600 19px var(--display)" }}>
                          {displayName}
                        </h2>
                        <p style={{ color: "var(--ink-3)" }}>
                          {user?.role || "Member"}
                        </p>
                      </div>
                    </div>

                    <p style={{ marginBottom: 6, color: "var(--ink-3)" }}>
                      Full name
                    </p>
                    <strong>{user?.fullName || "Not available"}</strong>

                    <hr
                      style={{
                        border: 0,
                        borderTop: "1px solid var(--line)",
                        margin: "18px 0",
                      }}
                    />

                    <p style={{ marginBottom: 6, color: "var(--ink-3)" }}>
                      Email address
                    </p>
                    <strong>{user?.email || "Not available"}</strong>

                    <hr
                      style={{
                        border: 0,
                        borderTop: "1px solid var(--line)",
                        margin: "18px 0",
                      }}
                    />

                    <p style={{ marginBottom: 6, color: "var(--ink-3)" }}>
                      Account role
                    </p>
                    <strong>{user?.role || "Member"}</strong>

                    <button
                      className="ghost-button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 24,
                        color: "#b42318",
                      }}
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          <footer className="footer">© 2026 Trackly</footer>
        </div>
      </main>

      {/* CREATE PROJECT DIALOG */}
      <dialog
        ref={projectDialogRef}
        className="dialog"
        onClick={(event) =>
          event.target === projectDialogRef.current &&
          projectDialogRef.current.close()
        }
      >
        <form onSubmit={createProject}>
          <h2>Create project</h2>

          <label>
            Project name
            <input
              name="name"
              required
              maxLength="100"
              placeholder="e.g. Website Redesign"
            />
          </label>

          <label>
            Project key
            <input
              name="projectKey"
              required
              minLength="2"
              maxLength="20"
              pattern="[A-Za-z0-9_-]+"
              placeholder="e.g. WEB"
            />
            <small>2–20 characters. Letters, numbers, _ and - only.</small>
          </label>

          <label>
            Description
            <textarea
              name="description"
              rows="3"
              maxLength="1000"
              placeholder="What is this project about?"
              style={{
                padding: 10,
                border: "1px solid var(--line-strong)",
                borderRadius: 8,
                resize: "vertical",
              }}
            />
          </label>

          <div className="dialog-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => projectDialogRef.current?.close()}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={savingProject}
            >
              {savingProject ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </dialog>

      {/* CREATE ISSUE DIALOG */}
      <dialog
        ref={issueDialogRef}
        className="dialog"
        onClick={(event) =>
          event.target === issueDialogRef.current &&
          issueDialogRef.current.close()
        }
      >
        <form onSubmit={createIssue}>
          <h2>New issue</h2>

          <label>
            Title
            <input
              name="title"
              required
              placeholder="What needs fixing?"
              autoFocus
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              rows="3"
              placeholder="Add more details about this issue..."
              style={{
                padding: 10,
                border: "1px solid var(--line-strong)",
                borderRadius: 8,
                resize: "vertical",
              }}
            />
          </label>

          <div className="field-row">
            <label>
              Type
              <select name="type" defaultValue="Bug">
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Priority
              <select name="priority" defaultValue="Medium">
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Assign to
            <select name="assigneeId" defaultValue="">
              <option value="">Unassigned</option>
              {users.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                </option>
              ))}
            </select>
          </label>

          <div className="dialog-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => issueDialogRef.current?.close()}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={savingIssue}
            >
              {savingIssue ? "Creating..." : "Create issue"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
