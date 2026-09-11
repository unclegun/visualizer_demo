import { initializeNavigation } from "./core/navigation.js";
import { initializeScrollProgress, initializeStickyNavbarState } from "./core/scroll-effects.js";
import { initializeThemeControls } from "./theme/theme-controller.js";
import { loadChartConfigs } from "./charts/chart-loader.js";
import { renderCharts } from "./charts/chart-renderer.js";
import { initializeRevealSystem } from "./components/reveal.js";
import { initializeSpotlightCards } from "./components/spotlight-cards.js";
import { initializeCounters } from "./components/counters.js";
import { initializeClipboardActions } from "./components/clipboard.js";
import { initializeProgressFills } from "./components/progress.js";
import { initializeFloatingToolbar } from "./components/floating-toolbar.js";
import { initializeDataTableModalDemo } from "./patterns/datatable-modal-demo.js";
import { initializeHtmxPartialsDemo } from "./patterns/htmx-partials-demo.js";
import { initializeHtmxModalDemo } from "./patterns/htmx-modal-demo.js";
import { initializeHtmxCascadingDemo } from "./patterns/htmx-cascading-demo.js";
import { initializeHtmxTableRefreshDemo } from "./patterns/htmx-table-refresh-demo.js";
import { initializeAdvancedHeadersDemo } from "./patterns/advanced-headers.js";
import { initializePremiumCardsDemo } from "./patterns/premium-cards.js";
import { initializeMicrointeractionsDemo } from "./patterns/microinteractions.js";
import { initializeDataDisplayDemo } from "./patterns/data-display.js";
import { initializeFormsFiltersDemo } from "./patterns/forms-filters.js";
import { initializeDashboardMotionDemo } from "./patterns/dashboard-motion.js";
import { initializeFocusPullHeroDemo } from "./patterns/focus-pull-hero.js";

async function initializeChartsIfPresent() {
  if (!document.querySelector("[data-chart-page]")) {
    return;
  }

  const configs = await loadChartConfigs();
  renderCharts(configs);
}

function normalizePageShell() {
  document.body.classList.add("site-shell");

  const path = window.location.pathname;
  if (path.endsWith("/index.html") || path === "/" || path.endsWith("/visualizer_demo/")) {
    document.body.classList.add("page-home");
  } else if (path.includes("/docs/")) {
    document.body.classList.add("page-doc");
  } else if (path.includes("css-visual-elements") || path.includes("llm-context-generator")) {
    document.body.classList.add("page-tool");
  } else if (path.includes("/patterns/")) {
    document.body.classList.add("page-pattern");
  }

  if (document.body.dataset.navSection === "advanced-ui") {
    document.body.classList.add("page-advanced");
  }

  const main = document.querySelector("main.page-shell, main.container-xl");
  if (main) {
    main.classList.add("site-main", "site-container");
    [...main.children].forEach((child) => {
      if (child.tagName === "SECTION") {
        child.classList.add("site-section");
      }
    });
  }

  const nav = document.querySelector(".site-navbar");
  if (nav) {
    nav.setAttribute("data-nav-rail", "");
  }

  if (!document.querySelector(".scroll-progress")) {
    const indicator = document.createElement("div");
    indicator.className = "scroll-progress";
    indicator.innerHTML = '<span data-scroll-progress></span>';
    document.body.prepend(indicator);
  }
}

function normalizePrimitiveClasses() {
  document.querySelectorAll(".site-hero").forEach((hero) => {
    hero.classList.add("page-hero");

    let eyebrow = hero.querySelector(".pattern-hero-kicker, .text-uppercase.small, .text-uppercase.small.fw-semibold");
    if (!eyebrow) {
      eyebrow = document.createElement("p");
      eyebrow.className = "pattern-hero-kicker mb-2 page-hero__eyebrow";
      if (document.body.classList.contains("page-doc")) {
        eyebrow.textContent = "Documentation";
      } else if (document.body.classList.contains("page-home")) {
        eyebrow.textContent = "Razor UI Patterns";
      } else if (document.body.classList.contains("page-tool")) {
        eyebrow.textContent = "Tooling Reference";
      } else {
        eyebrow.textContent = "Pattern Category";
      }
      hero.prepend(eyebrow);
    } else {
      eyebrow.classList.add("page-hero__eyebrow");
    }

    const title = hero.querySelector("h1, h2");
    title?.classList.add("page-hero__title");

    const lede = hero.querySelector(".lead, p.text-muted");
    lede?.classList.add("page-hero__lede");

    const actions = hero.querySelector(".d-flex");
    if (actions?.querySelector(".btn")) {
      actions.classList.add("page-hero__actions");
    }
  });

  document.querySelectorAll(".spike-toc").forEach((toc) => {
    toc.classList.add("page-toc", "is-sticky");
    const title = toc.querySelector("h2");
    title?.classList.add("page-toc__title");
    toc.querySelectorAll("a").forEach((link) => link.classList.add("page-toc__link"));
  });

  document.querySelectorAll(".badge-soft").forEach((badge) => {
    badge.classList.add("tag", "tag--primary");
  });

  document.querySelectorAll(".demo-shell").forEach((panel) => panel.classList.add("demo-panel"));
}

function initializeAgileSessionPrintControl() {
  const tabs = document.querySelector(".course-tabs");
  const main = document.querySelector("main.page-shell, main.container-xl");
  if (!tabs || !main || main.querySelector(".print-toolbar")) {
    return;
  }

  const toolbar = document.createElement("div");
  toolbar.className = "print-toolbar";
  toolbar.innerHTML = '<a class="btn btn-outline-primary" href="../agile-course.html">Back to course</a><button class="btn btn-primary" type="button">Print complete session</button>';
  toolbar.querySelector("button").addEventListener("click", () => window.print());
  main.prepend(toolbar);
}

function initializeAgileModuleExperience() {
  const match = window.location.pathname.match(/session-(0[1-6])\.html$/);
  const main = document.querySelector("main.page-shell, main.container-xl");
  if (!match || !main || main.dataset.agileModuleReady) {
    return;
  }

  const moduleNumber = Number(match[1]);
  const modules = [
    {
      title: "Agile/Scrum Foundation & Why",
      description: "Build a shared mental model for the team operating model and the October 1 workflow.",
      prep: "30–45 min",
      classTime: "50–60 min",
      lessons: "8 lessons",
      exercise: "Workflow mapping",
      visuals: "Two-Level Operating Model; Local Sprint Delivery Lifecycle",
      outcome: "Explain how Agile principles, Scrum practices, and Phased Sprint Delivery Plan rules fit together.",
      plan: [["Concept", "Agile values and principles", "10 min"], ["Concept", "Agile vs Scrum; transparency, inspection, adaptation", "10 min"], ["Program Rule", "Program-level vs Team-level operating model", "10 min"], ["Applied", "Current workflow vs October 1 workflow", "10 min"], ["Exercise", "Map existing work into the new lifecycle", "15 min"], ["Assessment", "Knowledge check and coaching discussion", "5 min"]],
      check: ["What is the difference between Agile and Scrum?", "Which controls remain in the local workflow?", "What becomes visible on October 1?"],
      resource: "program-context.html"
    },
    {
      title: "Organize the Work in Azure DevOps",
      description: "Make priority, implementation, acceptance, and escalation ownership explicit.", prep: "30–45 min", classTime: "50–60 min", lessons: "10 lessons", exercise: "Responsibility scenarios", visuals: "ADO Traceability Hierarchy; Governance Cadence", outcome: "Identify who prioritizes, implements, approves, accepts, and escalates in realistic situations.", plan: [["Concept", "Scrum accountabilities and technical leadership", "10 min"], ["Program Rule", "Program Manager, Government Lead/TPOC, customer, Team Lead, developer", "15 min"], ["Practice", "Risk and escalation ownership", "10 min"], ["Exercise", "Scenario ownership map", "20 min"], ["Assessment", "Knowledge check", "5 min"]], check: ["Who drives priorities within approved scope?", "Who decides technical implementation?", "Where does an outside-contract request go?"], resource: "program-context.html"
    },
    {
      title: "Plan the Sprint & Control Scope",
      description: "Turn approved objectives into traceable, estimable, and reviewable board work.", prep: "45–60 min", classTime: "50–60 min", lessons: "16 lessons", exercise: "Backlog refinement lab", visuals: "ADO Hierarchy; Board Standards", outcome: "Create a board-ready work item with traceability, acceptance criteria, and a healthy state.", plan: [["Concept", "Product and Sprint Backlogs; Epic → Feature → Work Item", "10 min"], ["Practice", "Acceptance criteria, slicing, bugs, spikes, and technical debt", "15 min"], ["Program Rule", "Board states, daily updates, five-day aging escalation", "10 min"], ["Exercise", "Classify, trace, refine, split, and place work", "20 min"], ["Assessment", "Board Health Test", "5 min"]], check: ["When may work enter In Progress?", "What does the five-business-day rule require?", "What belongs on the board?"], resource: "printable-reference.html"
    },
    {
      title: "Run the Sprint Day to Day",
      description: "Forecast with evidence and make scope and capacity tradeoffs visible.", prep: "45–60 min", classTime: "50–60 min", lessons: "15 lessons", exercise: "Capacity planning exercise", visuals: "Change Control; Capacity Allocation", outcome: "Build a capacity-based Sprint Goal and route scope changes through the approved decision flow.", plan: [["Practice", "Sprint Goal, forecast, relative estimation, velocity", "15 min"], ["Program Rule", "50% Major, 25% Minor, 25% meetings/admin", "10 min"], ["Applied", "PTO, support, dependency, and urgent-work adjustments", "10 min"], ["Program Rule", "Document → Assess → Review → Decision → Execute", "10 min"], ["Exercise", "Decide what fits, moves, or requires approval", "20 min"]], check: ["Is 50/25/25 generic Scrum or a program rule?", "What happens to new work during a sprint?", "What happens to unfinished work?"], resource: "program-context.html"
    },
    {
      title: "Develop & Review Code with TFVC",
      description: "Use the board to coordinate work, identify risk early, and protect the Sprint Goal.", prep: "45–60 min", classTime: "45–60 min", lessons: "14 lessons", exercise: "Board-driven standup simulation", visuals: "Daily Standup; Risk & Escalation", outcome: "Run a short board-driven Daily Scrum and assign clear follow-up and escalation for risks.", plan: [["Scrum Practice", "Daily Scrum purpose and Sprint Goal", "10 min"], ["Practice", "Right-to-left board walk and work-in-progress awareness", "10 min"], ["Program Rule", "Blockers, aging, and four risk categories", "10 min"], ["Exercise", "Standup simulation with follow-up owners", "20 min"], ["Assessment", "Knowledge check", "5 min"]], check: ["What is Daily Scrum for, and what is it not for?", "When is a blocker documented?", "Which risk category applies?"], resource: "printable-reference.html"
    },
    {
      title: "Deliver the Sprint End to End",
      description: "Practice the complete local delivery flow and make quality and acceptance decisions under pressure.", prep: "60 min", classTime: "60 min", lessons: "15 lessons", exercise: "Full sprint simulation", visuals: "Sprint Delivery Lifecycle; Definition of Done", outcome: "Move work through TFVC review, validation, UAT, acceptance, release, and retrospective improvement.", plan: [["Engineering Practice", "Work Item → Development → TFVC Shelveset → Lead Review", "15 min"], ["Engineering Practice", "Check-in, association, validation, and Definition of Done", "10 min"], ["Practice", "Sprint Review vs UAT vs Release vs Retrospective", "10 min"], ["Exercise", "Full sprint simulation with scenario reveals", "20 min"], ["Assessment", "Knowledge check and improvement action", "5 min"]], check: ["What does a shelveset provide before check-in?", "How are Sprint Review and UAT different?", "What should change when a Lead review or UAT rejects work?"], resource: "printable-reference.html"
    }
  ];
  const module = modules[moduleNumber - 1];
  const workshopDetails = {
    2: {
      title: "Organize the Work in Azure DevOps",
      question: "Where does work live and how do we maintain it?",
      outcomes: ["Create and classify an Epic, Feature, User Story, or Work Item.", "Write useful acceptance criteria and choose the correct board state.", "Keep ADO status, blockers, ownership, and traceability current without a separate verbal explanation."],
      concepts: ["ADO hierarchy: Application Modernization → Personnel Search → authorized organization filter.", "A useful work item includes title, outcome, criteria, parent, owner, estimate, iteration, state, history, and blocker detail.", "Feature board: Backlog → In Progress → In Review → Done. Task board: Backlog → In Progress → Done + Blocked flag."],
      demo: ["Find or create Epic", "Create or find Feature", "Create Work Item", "Link parent and objective", "Add title, description, acceptance criteria", "Assign, estimate, set iteration", "Move states and add comments", "Document a blocker and update status"],
      scenarios: ["Production bug arrives: classify it, trace it, and make the current state visible.", "Developer discovers extra database work: add the work, link it, and decide whether the item remains executable.", "Customer verbally requests unrelated work: document it and route it through the approved path.", "An item has been In Progress for more than five business days: identify the escalation.", "Coding is finished: inspect the board and decide whether the item is actually Done."],
      rules: ["ADO is the source of truth.", "Update every business day and move cards when status actually changes.", "Document blockers the same day.", "Acceptance criteria exist before In Progress.", "Work traces to an approved objective; stale In Progress work escalates to the Team Lead."],
      answers: ["The item is In Review only when development is complete and it is awaiting review, testing, or UAT; coding alone is not Done.", "A blocker is documented the same day with impact, owner, and next action; status should reflect reality.", "A verbal request is recorded in ADO and routed through the program decision path before unrelated work starts."],
      leadNote: "Team Leads remain active developers. Facilitate the ADO walkthrough by asking what evidence makes the item understandable, then coach the developer who owns the daily update. Do not become the person who maintains every card.",
      slides: ["Today’s question: Where does work live?", "ADO hierarchy", "Board workflow and state definitions", "Daily ADO rules", "Bad vs useful work item", "Acceptance criteria", "Live ADO walkthrough", "New request, blocker, and aging-item scenarios", "October 1 expectations"],
      plan: [["Recap", "Session 1 lifecycle and today’s ADO problem", "5 min"], ["Program Rule", "Epic → Feature → User Story / Work Item and ownership", "10 min"], ["Live Demo", "Create, link, refine, assign, estimate, and move work in ADO", "20 min"], ["Scenario", "Bug, extra database work, verbal request, stale item, coding complete", "10 min"], ["Expected Behavior", "Developer board and update rules", "5 min"], ["Discussion", "Questions and optional deeper demo", "10 min"]]
    },
    3: {
      title: "Plan the Sprint and Control Scope",
      question: "How does work move from backlog into the sprint, and what happens when the plan changes?",
      outcomes: ["Refine work until outcome, criteria, dependencies, and uncertainty are visible.", "Use relative points as a team forecast signal, not hours or a developer score.", "Apply 50/25/25 capacity and determine whether a request is normal execution or change control."],
      concepts: ["Refinement turns uncertainty into plan-ready work; a Sprint Goal describes the outcome the selected work supports.", "Relative estimates compare complexity, effort, and uncertainty to reference work using 1, 2, 3, 5, 8, and 13.", "Product Backlog → Refinement → Estimate → Priority → Capacity → Sprint Goal → Sprint Backlog."],
      demo: ["Open a prepared backlog of 8–10 realistic items", "Clarify acceptance criteria and dependencies", "Estimate and split oversized work", "Prioritize and apply capacity", "Set the Sprint Goal", "Select sprint work and assign iteration", "Document, assess, review, decide, and execute a scope change", "Show each ADO change through the decision flow"],
      scenarios: ["Urgent production bug: show what capacity or scope changes.", "New sprint-level request: identify the approval path and ADO evidence.", "Normal implementation task inside approved scope: explain why it does not need a new approval.", "Oversized story: split it into a valuable vertical slice.", "Unfinished item: return it to the backlog and reforecast.", "Customer asks for a new feature mid-sprint: distinguish a new Major effort from execution."],
      rules: ["50% Major, 25% Minor, 25% Meetings/Admin is a Program Rule, not Scrum.", "Account for PTO, sustainment/support, dependencies, and production issues.", "Forecast is evidence-based, not a guarantee or individual quota.", "Document → Assess → Review → Decision → Execute.", "Government Lead approval is required for sprint-level changes and new Epics."],
      answers: ["A normal implementation task inside approved sprint execution does not need a new approval; a sprint-level scope change or new Major effort does.", "An unfinished item returns to the backlog or is re-planned transparently; it is not counted as complete.", "PTO reduces available capacity, so the forecast or selected work changes visibly rather than silently overcommitting."],
      leadNote: "Team Leads facilitate planning without assigning every task. Ask what outcome the Sprint Goal protects, show the capacity tradeoff, and distinguish a local planning choice from Government Lead approval authority.",
      slides: ["Today’s question: How does work enter a sprint?", "Refinement and Sprint Goal", "Relative estimation and capacity", "50/25/25 Program Rule", "Prepared backlog demo", "Change-control workflow", "Scope-change scenarios", "Unfinished work and reforecasting"],
      plan: [["Recap", "ADO hierarchy and board states", "5 min"], ["Concept", "Refinement, Sprint Goal, estimation, capacity, forecast", "10 min"], ["Live Demo", "Refine 8–10 items, apply capacity, and select sprint work", "20 min"], ["Scenario", "Urgent bug, new scope, oversized story, unfinished work", "10 min"], ["Program Rule", "Change control and approval boundaries", "5 min"], ["Discussion", "Questions and optional planning demo", "10 min"]]
    },
    4: {
      title: "Run the Sprint Day to Day",
      question: "The sprint is active. What should developers and Team Leads do every day?",
      outcomes: ["Use a right-to-left board walk to focus collaboration on finishing work.", "Distinguish a blocker, risk, and dependency and record the right follow-up.", "Identify Schedule, Technical, Scope, and Dependency risk and escalate it at the right level."],
      concepts: ["Daily Scrum is a short coordination point for progress toward the Sprint Goal, not a Yesterday/Today/Blockers performance report.", "WIP awareness helps the team finish current work before blindly starting more.", "Aging work, blocked work, and review-ready work are board signals that require action."],
      demo: ["Open a sample Azure Board and state the Sprint Goal", "Demonstrate a bad status-round standup", "Walk the board right-to-left", "Ask what is closest to Done, stuck, blocked, or threatening the goal", "Update states, blockers, comments, and follow-up owners", "Show risk escalation from Developer to Team Lead to Government TPOC / Program Manager"],
      scenarios: ["Developer finishes early: pull the next valuable work only after checking the goal and board.", "Item is blocked by DB access: document the dependency same day and assign follow-up.", "Deep technical issue starts during standup: park troubleshooting with the right people.", "Sprint Goal is at risk: identify Schedule, Technical, Scope, or Dependency risk and escalate.", "Production issue appears: make impact and scope decision visible."],
      rules: ["Daily Scrum is coordination, blocker surfacing, early risk identification, and dependency discussion.", "It is not a management status report, detailed troubleshooting session, performance evaluation, or optional meeting.", "Walk right-to-left and finish before starting when possible.", "Update ADO every business day and document blockers same day.", "Escalate aging and risks early; keep technical deep dives after standup."],
      answers: ["A database access problem is a Dependency risk and should be documented with an owner and impact; it may also create Schedule risk.", "Detailed debugging moves outside the standup with the needed people; the board still records the blocker and next action.", "A new request is not silently pulled into the sprint; record it and determine whether change control applies."],
      leadNote: "Team Leads facilitate by protecting the Sprint Goal and asking board questions, not by collecting status for management. Remain a developer in the flow, name follow-up owners, and escalate before a risk becomes an emergency.",
      slides: ["Today’s question: What happens every day?", "Sprint Goal and board truth", "Standup is / is not", "Bad standup demonstration", "Good right-to-left board walk", "Risk categories and escalation", "Blocked, aging, and review-ready scenarios", "Expected update behavior"],
      plan: [["Recap", "Sprint Goal, selected work, and capacity", "5 min"], ["Concept", "Daily Scrum, WIP, blockers, dependencies, and risk", "10 min"], ["Live Demo", "Bad versus good board-driven standup", "20 min"], ["Scenario", "Early finish, blocker, deep issue, goal risk, production issue", "10 min"], ["Expected Behavior", "When to stay after standup and when to escalate", "5 min"], ["Discussion", "Questions and optional board walkthrough", "10 min"]]
    },
    5: {
      title: "Develop and Review Code with TFVC",
      question: "How does code move safely from developer work to reviewed and integrated code?",
      outcomes: ["Create a traceable TFVC shelveset from an ADO work item in the Development branch.", "Use Pending Changes, work-item association, review feedback, and changeset history correctly.", "Determine whether code satisfies the local Definition of Done instead of equating coding complete with Done."],
      concepts: ["TFVC workspace, Get Latest, Pending Changes, shelveset, changeset, and work-item association are Engineering Practices supporting Agile.", "Simple branch model: $/Application/Main with $/Application/Development for normal sprint development.", "Coding complete → Shelveset → Team Lead Review → Check-in → validation → UAT where required → Done."],
      demo: ["Open the ADO Work Item and get latest from $/Application/Main", "Make a sample change in the Development branch", "Inspect Pending Changes and associate the work item", "Create a shelveset such as WI-1842_AddAuditLogging", "Team Lead reviews the diff and requests changes", "Developer corrects and resubmits", "Check in and inspect changeset/work-item traceability"],
      scenarios: ["Lead rejects a shelveset: record feedback, rework, and resubmit.", "Reviewer is unavailable: identify the risk and escalation rather than bypassing review.", "Conflicting changes appear: pause, get latest, coordinate, and resolve deliberately.", "Developer forgot work-item association: correct traceability before check-in.", "Direct Main check-in is attempted: return to Development and the review path.", "Urgent production fix: use the approved exception and preserve review evidence."],
      rules: ["Engineering Practice supporting the Agile operating model.", "Normal work happens in $/Application/Development; reviewed work moves toward Main when appropriate.", "Developer → Shelveset → Team Lead Review → Check-in.", "Coding finished is not Done: validation and UAT may still be required.", "Unit tests, CI, automated gates, and sophisticated branching are Future Maturity only."],
      answers: ["Get Latest first, make the change in Development, inspect Pending Changes, associate the ADO Work Item, then create the shelveset for review.", "A rejected shelveset returns to rework and resubmission; the item remains out of Done until review and validation pass.", "A forgotten work-item association is corrected before check-in so the changeset remains traceable."],
      leadNote: "Team Leads are developers and reviewers, not a separate Scrum Master role. Review the diff against the work item and Definition of Done, give actionable feedback, and avoid becoming the only person who can integrate work.",
      slides: ["Today’s question: How does code move safely?", "TFVC workspace and simple branch model", "Pending Changes and work-item association", "Shelveset naming", "Live review and rework demo", "Check-in traceability", "Review, conflict, and urgent-fix scenarios", "Definition of Done"],
      plan: [["Recap", "ADO work item and Definition of Done", "5 min"], ["Engineering Practice", "TFVC workspace, Development branch, shelvesets, and review", "10 min"], ["Live Demo", "Work Item → Get Latest → Shelveset → Review → Check-in", "20 min"], ["Scenario", "Rejected review, unavailable lead, conflict, traceability, urgent fix", "10 min"], ["Expected Behavior", "Coding complete versus Done", "5 min"], ["Discussion", "Questions and optional TFVC deep demo", "10 min"]]
    },
    6: {
      title: "Deliver the Sprint End to End",
      question: "Can we run the complete operating model from request to delivery?",
      outcomes: ["Trace one feature from customer request through ADO, TFVC, validation, UAT, release, and retrospective.", "Explain what changes in ADO, communication, approval, scope, and Done status when a scenario interrupts flow.", "Distinguish Sprint Review, UAT, Release / Go Live, and Retrospective decisions."],
      concepts: ["Case study: Add audit-history search to an internal application.", "Each phase needs an owner, ADO evidence, acceptance evidence, and a next decision.", "Sprint Review inspects the increment; UAT validates customer expectations; Release deploys operationally; Retrospective selects one or two improvements."],
      demo: ["Start with one customer request", "Link Epic, Feature, Work Item, and acceptance criteria", "Refine, estimate, plan, and move into In Progress", "Run the Daily Scrum decision point", "Develop, create shelveset, review, check in, validate, and complete UAT", "Move to Done, Sprint Review, Release / Go Live, and Retrospective"],
      scenarios: ["Production defect appears: update ADO, risk, scope, and ownership.", "Customer requests additional scope: route change control and show what moves.", "Story is larger than expected: split or reforecast.", "Dependency blocks progress: document, assign, and escalate.", "Team Lead rejects shelveset: keep the item out of Done until rework passes.", "UAT rejects an acceptance criterion: return to rework and update evidence.", "Sprint ends with unfinished work: reforecast and preserve truthful status."],
      rules: ["Sprint Review inspects the delivered increment and gathers feedback.", "UAT validates customer acceptance expectations; it is distinct from Sprint Review.", "Release / Go Live is operational deployment timing.", "Retrospective inspects the process and selects one or two improvements.", "Done requires local Definition of Done evidence, not merely coding completion."],
      answers: ["A rejected shelveset keeps the item in development/rework and adds review evidence; it is not Done.", "A UAT rejection returns the work to correction against the acceptance criterion; customer acceptance is not implied by Sprint Review.", "Unfinished work is made visible, reforecast, and carried forward or re-prioritized; it is not hidden to make the sprint appear complete."],
      leadNote: "Facilitate the capstone as a case study, pausing at each interruption to ask what ADO evidence and approval are required. Keep the retrospective about the system and process, never individual performance.",
      slides: ["Today’s question: Can the whole system work?", "End-to-end lifecycle", "Definition of Done", "Live feature walkthrough", "Scenario reveals", "Review vs UAT vs Release vs Retro", "Final operating rules", "October 1 readiness"],
      plan: [["Recap", "Sessions 2–5 operating path", "5 min"], ["Concept", "Definition of Done and closeout distinctions", "10 min"], ["Live Demo", "One feature from request through release", "20 min"], ["Scenario", "Seven reveals across scope, risk, review, UAT, and unfinished work", "10 min"], ["Expected Behavior", "What changes in ADO and who must know", "5 min"], ["Discussion", "Questions and optional deeper walkthrough", "10 min"]]
    }
  }[moduleNumber];
  if (workshopDetails) {
    Object.assign(module, workshopDetails);
    module.exercise = "Live demo + scenario walkthroughs";
  }
  const hero = main.querySelector(".course-hero");
  const title = hero?.querySelector("h1");
  const kicker = hero?.querySelector(".pattern-hero-kicker");
  if (title && kicker) {
    kicker.textContent = `Module ${moduleNumber} of 6`;
    title.textContent = module.title;
    hero.classList.add("module-hero");
    const meta = hero.querySelector(".agile-session-meta");
    if (meta) {
      meta.insertAdjacentHTML("beforeend", `<span class="pill">${module.lessons}</span><span class="pill">Live demo included</span><span class="pill">Scenario walkthroughs included</span><span class="pill">${module.visuals}</span>`);
    }
  }

  const rows = module.plan.map(([type, lesson, time]) => `<div class="lesson-row"><span>${type}</span><b>${lesson}</b><em>${time}</em></div>`).join("");
  const answers = module.answers || module.check.map(() => "Use the local program context and explain what evidence should be visible before moving on.");
  const checks = module.check.map((question, index) => `<details><summary>${index + 1}. ${question}</summary><p>${answers[index]}</p></details>`).join("");
  const moduleNav = modules.map((item, index) => `<a class="${index + 1 === moduleNumber ? "is-current" : ""}" href="session-0${index + 1}.html"><span>Module ${index + 1}</span>${item.title}</a>`).join("");
  hero?.insertAdjacentHTML("afterend", `<section class="module-outcomes agile-card mb-4"><div><p class="pattern-hero-kicker mb-2">Module outcomes</p><h2 class="h4">By the end of this module, participants can...</h2><p class="mb-0">${module.outcome}</p></div><div class="module-outcomes__meta"><span><strong>Lead Prep</strong>${module.prep}</span><span><strong>Team Class</strong>${module.classTime}</span><span><strong>${moduleNumber > 1 ? "Format" : "Exercise"}</strong>${module.exercise}</span></div></section><section class="lesson-plan agile-card mb-4"><div class="d-flex justify-content-between align-items-end gap-2 flex-wrap"><div><p class="pattern-hero-kicker mb-2">Module syllabus</p><h2 class="h4 mb-1">Lesson plan</h2></div><span class="agile-pill">Learn → practice → check</span></div><div class="lesson-plan__rows">${rows}</div></section>`);
  const toc = main.querySelector(".course-toc");
  if (toc) {
    toc.innerHTML = `<h2 class="h5 mb-2">Course Content</h2><p class="small text-muted">Six modules · 3 weeks</p>${moduleNav}<hr /><a href="launch-readiness.html"><span>Capstone</span>Launch Readiness</a><a href="printable-packets.html"><span>Resources</span>Printable Packets</a>`;
    toc.classList.add("course-content-nav");
  }
  const layout = main.querySelector(".course-layout");
  if (moduleNumber > 1 && workshopDetails) {
    const concepts = module.concepts.map((concept) => `<li>${concept}</li>`).join("");
    const outcomes = module.outcomes.map((outcome) => `<li>${outcome}</li>`).join("");
    const leadNote = module.leadNote || "Team Leads facilitate the process while remaining active developers. Keep the discussion focused on evidence, decisions, and the next visible action.";
    layout?.insertAdjacentHTML("beforebegin", `<section id="module-overview" class="module-learning-flow mb-4"><details class="module-flow-nav"><summary>On This Module</summary><div><a href="#module-overview">Overview</a><a href="#lesson-map">Lesson Map</a><a href="#concepts">Concepts</a><a href="#live-demo">Live Demo</a><a href="#scenarios">Scenarios</a><a href="#program-rules">Program Rules</a><a href="#knowledge-check">Knowledge Check</a><a href="#lead-notes">Lead Notes</a><a href="#module-resources">Resources</a></div></details><div class="module-flow-main"><section class="agile-card module-section"><p class="pattern-hero-kicker mb-2">Core question</p><h2 class="h4">${module.question}</h2><p class="mb-0">This module is a self-contained guide for learning the workflow after the live class. Use the live system demonstration and scenario decisions as the primary teaching path.</p></section><section id="outcomes" class="agile-card module-section"><p class="pattern-hero-kicker mb-2">Learning outcomes</p><h2 class="h4">By the end of this module, participants can...</h2><ul class="workshop-list">${outcomes}</ul></section><section id="lesson-map" class="agile-card module-section"><p class="pattern-hero-kicker mb-2">Lesson map</p><h2 class="h4">A practical 45–60 minute session</h2><div class="lesson-plan__rows">${rows}</div></section><section id="concepts" class="agile-card module-section"><p class="pattern-hero-kicker mb-2">Learn the concepts</p><h2 class="h4">What to know before the demo</h2><ul class="workshop-list">${concepts}</ul></section></div></section>`);
    const demoSteps = module.demo.map((step, index) => `<li><strong>${index + 1}.</strong> ${step}</li>`).join("");
    const scenarioSteps = module.scenarios.map((scenario) => `<li>${scenario}</li>`).join("");
    const ruleSteps = module.rules.map((rule) => `<li>${rule}</li>`).join("");
    const slideSteps = module.slides.map((slide) => `<li>${slide}</li>`).join("");
    layout?.insertAdjacentHTML("afterend", `<section id="live-demo" class="workshop-grid mb-4"><div class="agile-card workshop-panel"><p class="pattern-hero-kicker mb-2">Live demonstration</p><h2 class="h4">See it in practice</h2><div class="workshop-timing"><span><strong>0–5</strong>Recap</span><span><strong>5–15</strong>Concepts</span><span><strong>15–35</strong>Live demo</span><span><strong>35–45</strong>Scenarios</span><span><strong>45–50</strong>Rules</span><span><strong>50–60</strong>Q&amp;A</span></div><ol class="workshop-list mt-4">${demoSteps}</ol></div><div id="scenarios" class="agile-card workshop-panel"><p class="pattern-hero-kicker mb-2">Instructor-led walkthrough</p><h2 class="h4">What happens if...?</h2><ul class="workshop-list">${scenarioSteps}</ul></div></section><section id="program-rules" class="agile-card workshop-panel mb-4"><p class="pattern-hero-kicker mb-2">Program Rules / Expected Behavior</p><h2 class="h4">What the team should do</h2><ul class="workshop-list">${ruleSteps}</ul></section><section class="module-support-grid mb-4"><div class="agile-card"><p class="pattern-hero-kicker mb-2">Suggested slide flow</p><h2 class="h4">Slides support the demo</h2><ol class="workshop-list">${slideSteps}</ol><p class="mb-0 text-muted">Keep slides to approximately 15 minutes, then spend the remaining time in the live system and discussion.</p></div><div id="knowledge-check" class="agile-card knowledge-check"><p class="pattern-hero-kicker mb-2">Knowledge check</p><h2 class="h4">Make the decision</h2>${checks}</div></section><section id="lead-notes" class="agile-card module-lead-notes mb-4"><details><summary><span class="pattern-hero-kicker">Lead Facilitation Note</span><strong>Help Team Leads facilitate while remaining developers</strong></summary><p>${leadNote}</p><p class="mb-0"><strong>Scrum Concept:</strong> Scrum describes facilitation accountabilities; this operating model has no dedicated Scrum Master. Team Leads perform facilitation responsibilities in addition to development and technical review duties.</p></details></section><section id="module-resources" class="agile-card module-resources mb-4"><p class="pattern-hero-kicker mb-2">Visual / printable resources</p><h2 class="h4">References for this module</h2><p class="mb-2">Relevant visuals: <strong>${module.visuals}</strong></p><a class="btn btn-sm btn-outline-primary" href="${module.resource}">Open reference</a> <a class="btn btn-sm btn-outline-primary" href="printable-reference.html">Printable quick reference</a> <a class="btn btn-sm btn-outline-primary" href="facilitator-scripts.html">Facilitator guide</a></section><section class="agile-callout success mb-4"><strong>Key takeaway:</strong> ${module.outcome}</section>`);
    main.querySelector(".course-layout")?.classList.add("module-reference-material");
    main.querySelector(".course-layout")?.insertAdjacentHTML("beforebegin", `<p class="module-reference-heading">Supporting reference material <span>Existing Lead Prep and Team Session notes retained below for facilitation and print.</span></p>`);
    const teamPane = main.querySelector(`#team-session-${match[1]}`);
    teamPane?.querySelectorAll("h3").forEach((heading) => {
      if (/exercise/i.test(heading.textContent)) heading.textContent = heading.textContent.replace(/exercise/ig, "Instructor-led walkthrough");
    });
    teamPane?.querySelectorAll("p").forEach((paragraph) => {
      const originalText = paragraph.textContent;
      const updatedText = originalText.replace(/hands-on exercise|exercise/ig, "live demonstration and scenario walkthrough").replace(/Give groups five cards[^.]*\./i, "Walk through five cards live and ask learners to identify who prioritizes, implements, approves, accepts, and escalates.");
      if (updatedText !== originalText) {
        paragraph.textContent = updatedText;
      }
    });
    const tabButtons = main.querySelectorAll(`.course-tabs [data-bs-target="#lead-session-${match[1]}"] , .course-tabs [data-bs-target="#team-session-${match[1]}"]`);
    if (tabButtons[0]) tabButtons[0].textContent = "Supporting Lead Notes";
    if (tabButtons[1]) tabButtons[1].textContent = "Supporting Team Reference";
  } else {
    layout?.insertAdjacentHTML("afterend", `<section class="module-support-grid mb-4"><div class="agile-card"><p class="pattern-hero-kicker mb-2">Class exercise</p><h2 class="h4">${module.exercise}</h2><p>Use the existing Team Session exercise, then record the decision in ADO or the scenario board. Facilitators should ask what changed, who owns the next step, and what evidence makes the work ready.</p><a href="#team-session-${match[1]}">Jump to Team Session — Teach It</a></div><div class="agile-card knowledge-check"><p class="pattern-hero-kicker mb-2">Knowledge check</p><h2 class="h4">Apply the rule</h2>${checks}</div></section><section class="agile-card module-resources mb-4"><p class="pattern-hero-kicker mb-2">Module resources</p><h2 class="h4">Visual and printable references</h2><p class="mb-2">Relevant visuals: <strong>${module.visuals}</strong></p><a class="btn btn-sm btn-outline-primary" href="${module.resource}">Open reference</a> <a class="btn btn-sm btn-outline-primary" href="printable-reference.html">Printable quick reference</a> <a class="btn btn-sm btn-outline-primary" href="facilitator-scripts.html">Facilitator guide</a></section>`);
  }
  main.dataset.agileModuleReady = "true";
}

function initializeAgileCourseCurriculum() {
  if (!window.location.pathname.endsWith("/agile-course.html")) {
    return;
  }

  const titles = [
    "Agile/Scrum Foundation & Why",
    "Organize the Work in Azure DevOps",
    "Plan the Sprint & Control Scope",
    "Run the Sprint Day to Day",
    "Develop & Review Code with TFVC",
    "Deliver the Sprint End to End"
  ];
  titles.forEach((title, index) => {
    const module = document.querySelector(`#module-${index + 1}`)?.closest(".accordion-item");
    const heading = module?.querySelector(".accordion-button strong");
    if (heading) heading.textContent = title;
    module?.querySelectorAll(".lesson-row span").forEach((label) => {
      if (index > 0 && label.textContent.trim() === "Exercise") label.textContent = "Live Demo";
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  normalizePageShell();
  normalizePrimitiveClasses();
  initializeAgileCourseCurriculum();
  initializeAgileModuleExperience();
  initializeAgileSessionPrintControl();
  initializeNavigation();
  initializeStickyNavbarState();
  initializeScrollProgress();
  await initializeThemeControls();
  initializeRevealSystem();
  initializeSpotlightCards();
  initializeCounters();
  initializeClipboardActions();
  initializeProgressFills();
  initializeFloatingToolbar();
  await initializeChartsIfPresent();
  initializeDataTableModalDemo();
  initializeHtmxPartialsDemo();
  initializeHtmxModalDemo();
  initializeHtmxCascadingDemo();
  initializeHtmxTableRefreshDemo();
  initializeAdvancedHeadersDemo();
  initializePremiumCardsDemo();
  initializeMicrointeractionsDemo();
  initializeDataDisplayDemo();
  initializeFormsFiltersDemo();
  initializeDashboardMotionDemo();
  initializeFocusPullHeroDemo();
});
