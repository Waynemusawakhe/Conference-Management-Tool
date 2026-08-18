# CMT Standalone Landing Page

This is a standalone **Home/Landing page only** for the CMT frontend.

It is deliberately separated from the rest of the application so other team members can build:
- Conferences
- Authentication
- User dashboards
- Organizer/reviewer/author dashboards
- About
- Help & FAQ
- Testimonials
- Contact

## Structure

```text
src/
├── components/
│   ├── ConferenceCard.jsx
│   ├── HeroVisual.jsx
│   ├── Logo.jsx
│   ├── Navbar.jsx
│   ├── SearchBar.jsx
│   ├── SectionHeading.jsx
│   └── StatCard.jsx
├── data/
│   └── mockConferences.js
├── pages/
│   └── Home.jsx
├── services/
│   └── conferenceService.js
├── App.jsx
└── main.jsx
```

The conference mock data is isolated in `data/` and accessed through `services/`.
When the backend API is ready, the service layer can be changed without redesigning the UI.

## Run

```bash
npm install
npm run dev
```


## Important

This is a **frontend foundation/demo**, not the final complete CMT system.
