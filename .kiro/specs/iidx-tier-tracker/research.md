# Research & Design Decisions

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design for the IIDX Tier Tracker.

**Usage**:
- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.
---

## Summary
- **Feature**: `iidx-tier-tracker`
- **Discovery Scope**: New Feature
- **Key Findings**:
  - The proposed technology stack (React, Node.js, PostgreSQL) is well-supported and has extensive documentation.
  - Google OAuth authentication can be robustly implemented using Passport.js on the backend.
  - A public API for `score.iidx.app` (IST) does not exist, making the automatic lamp update feature a significant technical risk that may rely on web scraping behind a login.
  - Music data scraping from `textage.cc` is feasible using standard libraries like `axios` and `cheerio`.

## Research Log

### 1. External Service: IIDX Score Tracker (IST) API
- **Context**: Requirement 3.4 calls for automatic lamp updates by linking a user's IIDX ID and fetching data from a score tracker site like `score.iidx.app`.
- **Sources Consulted**: Google searches for "score.iidx.app API", "iidx score tracker api".
- **Findings**: There is no evidence of a publicly available, documented API for IST. The service appears to be a user-facing web application.
- **Implications**: Automatic integration as described is not possible via a standard API. The only alternative would be to simulate a user login and scrape the user's private data. This is technically complex, brittle (it will break if the site's HTML structure changes), and may be against the site's terms of service. This feature carries a high implementation risk.

### 2. External Service: Textage Music Data
- **Context**: Requirement 2.0 requires creating a tool to scrape music data from sites like `textage.cc`.
- **Sources Consulted**: Google searches for "nodejs cheerio web scraping tutorial".
- **Findings**: This is a very common task in Node.js. The standard approach is to use a library like `axios` or `node-fetch` to download the HTML of the target page, and then use `cheerio` to parse the HTML and extract content using jQuery-like CSS selectors. The process is well-understood and documented.
- **Implications**: A separate, manually-triggered Node.js script can be created to perform this task. The script will parse the relevant tables on Textage and output a structured format (e.g., JSON) that can be imported into the application's database.

### 3. Technology: User Authentication with Google OAuth
- **Context**: Requirement 1.0 expresses a preference for Google Account login.
- **Sources Consulted**: Google searches for "react nodejs express google oauth passport.js tutorial".
- **Findings**: `Passport.js` with the `passport-google-oauth20` strategy is the de-facto standard for implementing Google OAuth on a Node.js/Express backend. The flow is well-documented: the React frontend redirects to a backend endpoint, which initiates the Passport authentication flow. After Google authenticates the user, it calls a backend callback URL, where a session is created.
- **Implications**: The design will include backend routes for `/auth/google` and `/auth/google/callback`. The frontend will have a "Login with Google" button that links to the backend's `/auth/google` endpoint. User profile information will be stored in a server-side session.

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|---|---|---|---|---|
| Monolithic Full-Stack | A single Node.js/Express application serves both the API and the React frontend assets. | Simple to develop and deploy initially. Low complexity. | Tightly coupled. Scaling the frontend and backend independently is difficult. | Suitable for a small project like this. The recommended approach for simplicity. |
| Decoupled Frontend/Backend | A standalone React application communicates with a separate Node.js API. | Clear separation of concerns. Independent scaling and deployment. | Higher initial setup complexity. Requires handling CORS. | Overkill for this project's initial scope, but a valid future evolution path. |

## Design Decisions

### Decision: Adopt a Monolithic Full-Stack Architecture
- **Context**: The application is a small, self-contained project with a single developer.
- **Alternatives Considered**: A fully decoupled (separate frontend/backend) architecture.
- **Selected Approach**: A single Express server will be created. It will have API routes (e.g., `/api/...`) and a catch-all route that serves the built React application's `index.html`.
- **Rationale**: This is the simplest approach for a small project. It avoids the complexities of managing two separate services, deployments, and CORS configurations.
- **Trade-offs**: Less scalable in the long term, but this is not a primary concern for a personal tier tracker.
- **Follow-up**: Ensure the build process for the React app correctly places the static files where the Express server can find them.

### Decision: Defer IST Integration and Treat as High-Risk
- **Context**: Research revealed no public API for IST, making the feature dependent on risky web scraping.
- **Alternatives Considered**:
  1. Attempt to build the authenticated scraping mechanism.
  2. Remove the requirement entirely.
- **Selected Approach**: The initial design and implementation will NOT include the IST integration. The feature will be marked as a high-risk, post-launch stretch goal. The design will, however, consider a data model that could accommodate imported data in the future.
- **Rationale**: Focusing on the core, achievable features first ensures a usable product can be delivered. Attempting the IST scraping from the start could derail the project due to its complexity and brittleness.
- **Trade-offs**: The "automatic" update feature, a key user desire, will be missing from the initial release.
- **Follow-up**: If attempted later, this feature must be built in a highly isolated module to prevent its potential failure from impacting the core application.

## Risks & Mitigations
- **Risk 1 (High)**: The automatic IST integration (Req 3.4) is not feasible without a public API and relies on brittle, authenticated web scraping.
  - **Mitigation**: Defer this feature. Focus on a solid manual clear lamp management system first. If pursued later, build it as an isolated, non-critical module.
- **Risk 2 (Medium)**: The Textage scraping tool (Req 2.0) could break if Textage changes its HTML structure.
  - **Mitigation**: The tool will be a manually-run script. If it breaks, the application remains functional with its existing data. The script can be updated as needed when the site structure changes.
- **Risk 3 (Low)**: The project has no defined steering context for technology or architecture.
  - **Mitigation**: Adopt industry-standard, well-documented technologies (React, Node.js, PostgreSQL) to ensure a solid foundation and ease of future maintenance.

## References
- [Passport.js](http://www.passportjs.org/)
- [Cheerio.js](https://cheerio.js.org/)
- [Textage IIDX Score Tables](https://textage.cc/score/)
