import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Accessibility,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Handshake,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers3,
  MessageCircle,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";

const WORKFLOWS = {
  university: {
    eyebrow: "University example",
    title: "A research conference across different faculties",
    description:
      "A faculty can organise a research conference while students, lecturers, researchers and invited guests take part in the same event.",
    steps: [
      {
        title: "Create and publish",
        detail: "An organiser adds conference details, dates and submission information.",
      },
      {
        title: "Discover and submit",
        detail: "Researchers find the event and submit proposals where a call for papers is offered.",
      },
      {
        title: "Review and decide",
        detail: "Assigned reviewers evaluate submissions and organisers record decisions.",
      },
      {
        title: "Plan and participate",
        detail: "Organisers manage sessions; attendees can register for the conference.",
      },
      {
        title: "View activity",
        detail: "Authorised users can view available conference information and reports.",
      },
    ],
    note: "Example: an annual university research symposium involving several faculties.",
  },
  student: {
    eyebrow: "Student organisation example",
    title: "A student chapter hosts a campus conference",
    description:
      "Student chapters, societies and student leadership groups can bring students from different faculties together for a conference. A committee member with organiser access can publish the details, organise sessions and manage registrations.",
    steps: [
      {
        title: "Plan the conference",
        detail: "A chapter or student committee agrees on a theme, speakers, sessions and a date.",
      },
      {
        title: "Publish the details",
        detail: "A member with organiser access creates the conference on CMT.",
      },
      {
        title: "Invite students",
        detail: "Students, lecturers and invited guests can find the conference and register.",
      },
      {
        title: "Prepare the programme",
        detail: "Organisers add sessions and check the registration records.",
      },
      {
        title: "Bring people together",
        detail: "Students attend, meet others and learn from the event.",
      },
    ],
    note: "Example: a student leadership conference or a technology conference hosted by a campus chapter.",
  },
  business: {
    eyebrow: "Business example",
    title: "An industry conference from start to finish",
    description:
      "A business or professional association can publish a conference, share its details and manage registrations. Not every event needs proposal submissions or peer review.",
    steps: [
      {
        title: "Create the event",
        detail: "An organiser publishes the event's details, dates and location.",
      },
      {
        title: "Share the opportunity",
        detail: "Visitors discover the event using the public conference listings.",
      },
      {
        title: "Manage registrations",
        detail: "Attendees sign up, and organisers can work with registration records.",
      },
      {
        title: "Organise sessions",
        detail: "Organisers manage the available conference sessions and programme information.",
      },
      {
        title: "Review activity",
        detail: "Authorised users access available reporting and conference records.",
      },
    ],
    note: "Example: an industry conference or a professional association's annual gathering.",
  },
};

const FEATURES = [
  {
    icon: Search,
    title: "Conference discovery",
    description: "Browse available conferences and use search and filters to find relevant events.",
  },
  {
    icon: ShieldCheck,
    title: "Workspaces for each role",
    description: "Authors, reviewers, organisers, attendees and admins have interfaces for their tasks.",
  },
  {
    icon: FileText,
    title: "Submissions and reviews",
    description: "Support proposals, assigned peer reviews and organiser decisions when an event needs them.",
  },
  {
    icon: Users,
    title: "Attendee registration",
    description: "Let attendees register and help organisers keep track of registration records.",
  },
  {
    icon: CalendarDays,
    title: "Sessions and schedules",
    description: "Organise conference sessions and make event programme information available.",
  },
  {
    icon: BarChart3,
    title: "Administration and reports",
    description: "Give authorised team members access to available records, summaries and reports.",
  },
];

const FOCUS_RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8b7eff]";

function FlipCard({ icon: Icon, title, description, points, colorClass, bgClass }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => setIsFlipped(!isFlipped);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleFlip();
    }
  };

  return (
    <div
      className="group h-[380px] w-full cursor-pointer [perspective:1000px] transition-transform duration-300 hover:-translate-y-1"
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Flip card to read more about ${title}`}
    >
      <div
        className={`relative h-full w-full transition-all duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 flex flex-col rounded-[22px] border border-[#e0e5ef] bg-white p-6 shadow-[0_16px_45px_rgba(12,28,62,.05)] transition-shadow group-hover:shadow-[0_20px_50px_rgba(12,28,62,.1)] [backface-visibility:hidden] dark:border-[#1e293b] dark:bg-[#0f172a] dark:group-hover:shadow-[0_20px_50px_rgba(0,0,0,.4)] sm:p-8">
          <div className="flex items-center gap-3">
            <span className={`rounded-2xl p-3 ${bgClass} ${colorClass} dark:bg-opacity-20`}>
              <Icon size={27} aria-hidden="true" />
            </span>
            <h3 className="text-xl font-bold text-[#0d1b3d] dark:text-white sm:text-2xl">{title}</h3>
          </div>
          <p className="mt-5 text-base leading-8 text-[#53617b] dark:text-[#94a3b8] line-clamp-6">
            {description}
          </p>
          
          <div className="mt-auto flex items-center justify-between border-t border-[#f0f2f6] pt-4 dark:border-[#1e293b]">
             <span className="text-xs font-bold uppercase tracking-wide text-[#5c50ec] dark:text-[#a9a2ff]">
                Tap to flip
             </span>
             <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f3ff] text-[#5c50ec] transition group-hover:bg-[#5c50ec] group-hover:text-white dark:bg-[#2a2354] dark:text-[#a9a2ff] dark:group-hover:bg-[#5c50ec] dark:group-hover:text-white">
                <RotateCw size={14} />
             </span>
          </div>
        </div>

        {/* Back of Card */}
        <div className="absolute inset-0 flex flex-col rounded-[22px] border border-[#e0e5ef] bg-white p-6 shadow-[0_16px_45px_rgba(12,28,62,.05)] [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-[#1e293b] dark:bg-[#0f172a] sm:p-8">
          <h3 className="text-lg font-bold text-[#0d1b3d] border-b border-[#f0f2f6] pb-3 mb-4 dark:text-white dark:border-[#1e293b]">
            {title}
          </h3>
          <ul className="space-y-3 text-[13px] leading-6 text-[#34425e] overflow-y-auto pr-2 dark:text-[#cbd5e1] custom-scrollbar">
            {points.map((point, idx) => (
              <li key={idx} className="flex gap-2.5">
                <CheckCircle2 className="mt-1 shrink-0 text-[#5c50ec] dark:text-[#a9a2ff]" size={16} aria-hidden="true" /> 
                <span>{point}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-auto flex items-center justify-between text-[#66728b] dark:text-[#94a3b8] pt-4">
             <span className="text-xs font-bold uppercase tracking-wide">
                Flip back
             </span>
             <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f0f2f6] transition hover:bg-[#e4e8f0] dark:bg-[#1e293b] dark:hover:bg-[#334155]">
                <RotateCw size={12} className="-scale-x-100" />
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  const [audience, setAudience] = useState("university");
  const workflow = WORKFLOWS[audience];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f7f9fc] text-[#0d1b3d] dark:bg-[#0a0f1f] dark:text-white transition-colors">
      <Navbar />

      <main id="cmt-main-content">
        <section
          aria-labelledby="about-title"
          className="relative overflow-hidden bg-[radial-gradient(circle_at_78%_22%,rgba(98,83,245,.25),transparent_35%),linear-gradient(135deg,#07132f_0%,#0a1740_55%,#15165a_100%)] px-5 py-16 text-white sm:py-24"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 right-[12%] h-80 w-80 rounded-full border border-white/10" aria-hidden="true" />

          <div className="relative z-10 mx-auto max-w-[1200px]">
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.12em] text-[#c4bdff]">
              <Sparkles size={17} aria-hidden="true" /> About CMT
            </span>
            <h1
              id="about-title"
              className="mb-5 mt-5 max-w-[900px] text-4xl font-extrabold leading-[1.12] tracking-[-.045em] sm:text-5xl lg:text-[60px]"
            >
              Conferences bring people together. <span className="text-[#c4bdff]">CMT makes them easier to manage.</span>
            </h1>
            <p className="max-w-[760px] text-base leading-8 text-white/80 sm:text-lg">
              Whether it is a faculty research conference, a student chapter summit
              or an industry gathering, CMT helps organisers publish event details
              and helps people find conferences they want to attend.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/conferences"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#6957ff] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#221c77]/25 motion-safe:transition-colors hover:bg-[#8171ff] dark:bg-[#5c50ec] dark:hover:bg-[#4a3ec9] ${FOCUS_RING}`}
              >
                Explore conferences <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a
                href="#how-cmt-works"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white motion-safe:transition-colors hover:bg-white/10 ${FOCUS_RING}`}
              >
                See how CMT works
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/80">
              <span className="inline-flex items-center gap-2"><GraduationCap size={18} aria-hidden="true" /> Universities</span>
              <span className="inline-flex items-center gap-2"><Users size={18} aria-hidden="true" /> Student chapters and societies</span>
              <span className="inline-flex items-center gap-2"><Building2 size={18} aria-hidden="true" /> Businesses and organisations</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="why-heading" className="bg-white px-5 py-16 dark:bg-[#0a0f1f] sm:py-20">
          <div className="mx-auto grid max-w-[1200px] items-start gap-10 lg:grid-cols-[.95fr_1.05fr] lg:gap-16">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#5c50ec] dark:text-[#a9a2ff]">Why CMT exists</p>
              <h2 id="why-heading" className="mt-3 text-3xl font-bold leading-tight tracking-[-.04em] text-[#0d1b3d] dark:text-white sm:text-4xl">
                Running a conference should not mean chasing emails.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#53617b] dark:text-[#94a3b8]">
                Conference details, submissions and registrations can end up in
                different inboxes and spreadsheets. It becomes difficult to know
                who has registered, what still needs review or which information
                is up to date.
              </p>
              <p className="mt-4 text-base leading-8 text-[#53617b] dark:text-[#94a3b8]">
                CMT brings the main conference tasks into one place. Organisers
                can manage events, while authors, reviewers and attendees see
                the information relevant to them.
              </p>
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#e3e3ff] bg-[#f4f3ff] p-4 text-sm leading-7 text-[#39336e] dark:border-[#2a2354] dark:bg-[#1a1638] dark:text-[#cbd5e1]">
                <CheckCircle2 className="mt-1 shrink-0 text-[#5c50ec] dark:text-[#a9a2ff]" size={20} aria-hidden="true" />
                <span>A faculty, student society or business can start with the conference features it actually needs.</span>
              </div>
            </div>

            <div className="rounded-[22px] bg-[#091634] p-6 text-white shadow-[0_24px_60px_rgba(7,19,47,.16)] sm:p-8">
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.1em] text-[#beb7ff]">
                <Layers3 size={18} aria-hidden="true" /> What CMT brings together
              </p>
              <ul className="mt-6 grid gap-4">
                {[
                  "Public conference information and discovery",
                  "Users, permissions and separate workspaces for each role",
                  "Proposal submissions and peer reviews, when needed",
                  "Attendee registration and session management",
                  "Administrative records and available reports",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-[#e6e9f6]">
                    <CheckCircle2 className="mt-1 shrink-0 text-[#9e95ff]" size={19} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-7 rounded-xl bg-white/10 p-4 text-sm leading-7 text-[#d8def2]">
                <strong className="block text-white">Our goal</strong>
                Help people find conferences and give organising teams a clearer way to run them.
              </p>
            </div>
          </div>
        </section>

        {/* FLIP CARDS SECTION */}
        <section aria-labelledby="audience-heading" className="px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="max-w-[800px]">
              <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#5c50ec] dark:text-[#a9a2ff]">Who can use CMT?</p>
              <h2 id="audience-heading" className="mt-3 text-3xl font-bold tracking-[-.04em] text-[#0d1b3d] dark:text-white sm:text-4xl">
                Conferences for campuses, student groups and businesses.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#53617b] dark:text-[#94a3b8]">
                CMT is intended for more than one faculty or department. Student
                chapters, research teams and professional groups also organise
                conferences. They need a straightforward way to share event information
                and manage attendance.
              </p>
            </div>

            <div className="mt-10 grid gap-6 xl:grid-cols-3">
              <FlipCard
                icon={GraduationCap}
                title="Faculties and researchers"
                description="A faculty or department can use CMT to organise research conferences and share them with the wider university community."
                colorClass="text-[#5c50ec] dark:text-[#a9a2ff]"
                bgClass="bg-[#efedff] dark:bg-[#2a2354]"
                points={[
                  "Researchers and postgraduate students can discover conferences and submit proposals when applicable.",
                  "Lecturers and appointed reviewers can assess assigned submissions.",
                  "Faculty organisers can manage conference details, sessions and registrations.",
                  "Authorised staff can access available reports."
                ]}
              />

              <FlipCard
                icon={Handshake}
                title="Student chapters and organisations"
                description="Student chapters, campus clubs, and academic societies bring students together for talks and leadership gatherings. CMT gives the committee a place to publish details and track registrations."
                colorClass="text-[#5145b9] dark:text-[#a9a2ff]"
                bgClass="bg-[#f0f4ff] dark:bg-[#2a2354]"
                points={[
                  "A committee member with organiser access can publish the event details.",
                  "Students across different faculties can find the event and register.",
                  "The organising committee can share session information and check registrations.",
                  "Lecturers, students and industry guests can use the same conference listing."
                ]}
              />

              <FlipCard
                icon={Building2}
                title="Businesses and industry"
                description="Companies and professional associations can use CMT to share conference information and coordinate attendance. They can use core event features without an academic review process."
                colorClass="text-[#264eac] dark:text-[#a9a2ff]"
                bgClass="bg-[#edf3ff] dark:bg-[#2a2354]"
                points={[
                  "Organisers can publish event information in a central location.",
                  "Professionals and guests can discover events and register to attend.",
                  "Teams can organise sessions and work with registration records.",
                  "Available reports can help authorised users review event activity."
                ]}
              />
            </div>
          </div>
        </section>

        <section id="how-cmt-works" aria-labelledby="workflow-heading" className="scroll-mt-8 bg-white px-5 py-16 dark:bg-[#0a0f1f] sm:py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="max-w-[820px]">
              <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#5c50ec] dark:text-[#a9a2ff]">How CMT works</p>
              <h2 id="workflow-heading" className="mt-3 text-3xl font-bold tracking-[-.04em] text-[#0d1b3d] dark:text-white sm:text-4xl">
                Here is how a conference could work.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#53617b] dark:text-[#94a3b8]">
                Choose an example to see how the main steps fit together.
                These examples explain the process. They do not create an actual conference.
              </p>
            </div>

            <div className="mt-8 inline-flex max-w-full flex-wrap gap-2 rounded-2xl bg-[#f1f2fb] p-2 dark:bg-[#0f172a]" role="group" aria-label="Choose a conference example">
              <button
                type="button"
                aria-pressed={audience === "university"}
                onClick={() => setAudience("university")}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold motion-safe:transition-colors ${FOCUS_RING} ${audience === "university" ? "bg-[#5c50ec] text-white shadow-sm dark:bg-[#2a2354]" : "text-[#43506a] hover:bg-white dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"}`}
              >
                <GraduationCap size={19} aria-hidden="true" /> University example
              </button>
              <button
                type="button"
                aria-pressed={audience === "student"}
                onClick={() => setAudience("student")}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold motion-safe:transition-colors ${FOCUS_RING} ${audience === "student" ? "bg-[#5c50ec] text-white shadow-sm dark:bg-[#2a2354]" : "text-[#43506a] hover:bg-white dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"}`}
              >
                <Handshake size={19} aria-hidden="true" /> Student organisation
              </button>
              <button
                type="button"
                aria-pressed={audience === "business"}
                onClick={() => setAudience("business")}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold motion-safe:transition-colors ${FOCUS_RING} ${audience === "business" ? "bg-[#5c50ec] text-white shadow-sm dark:bg-[#2a2354]" : "text-[#43506a] hover:bg-white dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"}`}
              >
                <Building2 size={19} aria-hidden="true" /> Business example
              </button>
            </div>

            <p className="sr-only" role="status" aria-live="polite">
              Showing {audience === "university" ? "university" : audience === "student" ? "student organisation" : "business"} conference workflow.
            </p>
            <div className="mt-6 rounded-[22px] border border-[#e1e5ef] bg-[#f9faff] p-5 dark:border-[#1e293b] dark:bg-[#0f172a] sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[#5c50ec] dark:text-[#a9a2ff]">{workflow.eyebrow}</p>
              <h3 className="mt-2 text-2xl font-bold tracking-[-.03em] text-[#0d1b3d] dark:text-white sm:text-3xl">{workflow.title}</h3>
              <p className="mt-3 max-w-[850px] text-base leading-8 text-[#53617b] dark:text-[#94a3b8]">{workflow.description}</p>

              <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {workflow.steps.map((step, index) => (
                  <li key={`${audience}-${step.title}`} className="rounded-2xl border border-[#e2e6f1] bg-white p-5 dark:border-[#1e293b] dark:bg-[#0a0f1f]">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#efedff] text-sm font-extrabold text-[#5546df] dark:bg-[#2a2354] dark:text-[#a9a2ff]" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h4 className="mt-4 text-base font-bold text-[#0d1b3d] dark:text-white">{step.title}</h4>
                    <p className="mt-2 text-sm leading-7 text-[#53617b] dark:text-[#94a3b8]">{step.detail}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 border-t border-[#e0e5ef] pt-5 text-sm font-medium leading-7 text-[#405078] dark:border-[#1e293b] dark:text-[#cbd5e1]">
                <BookOpen size={18} className="mr-2 inline-block align-middle text-[#5c50ec] dark:text-[#a9a2ff]" aria-hidden="true" />
                {workflow.note}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="features-heading" className="px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px]">
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#5c50ec] dark:text-[#a9a2ff]">What the platform offers</p>
            <h2 id="features-heading" className="mt-3 text-3xl font-bold tracking-[-.04em] text-[#0d1b3d] dark:text-white sm:text-4xl">
              What you can do with CMT.
            </h2>
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-2xl border border-[#e1e5ef] bg-white p-6 shadow-[0_12px_30px_rgba(12,28,62,.04)] dark:border-[#1e293b] dark:bg-[#0f172a]">
                  <span className="inline-flex rounded-xl bg-[#efedff] p-3 text-[#5c50ec] dark:bg-[#2a2354] dark:text-[#a9a2ff]"><Icon size={23} aria-hidden="true" /></span>
                  <h3 className="mt-5 text-lg font-bold text-[#0d1b3d] dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#53617b] dark:text-[#94a3b8]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="inclusion-heading" className="bg-white px-5 py-16 dark:bg-[#0a0f1f] sm:py-20">
          <div className="mx-auto grid max-w-[1200px] items-center gap-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-14">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#5c50ec] dark:text-[#a9a2ff]">Designed for real people</p>
              <h2 id="inclusion-heading" className="mt-3 text-3xl font-bold tracking-[-.04em] text-[#0d1b3d] dark:text-white sm:text-4xl">
                Making the website easier to use.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#53617b] dark:text-[#94a3b8]">
                People should be able to find conference information whether
                they are using a laptop, a phone or assistive technology. Our
                frontend supports keyboard navigation, and we are testing tools
                for reading text aloud, enlarging text and increasing contrast.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#66728b] dark:text-[#94a3b8]">
                We are still testing the experience with screen readers and across
                different user journeys. These extra controls are not a replacement
                for a screen reader.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-start gap-4 rounded-2xl border border-[#e1e5ef] bg-[#f9faff] p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
                <Accessibility className="mt-1 shrink-0 text-[#5c50ec] dark:text-[#a9a2ff]" size={25} aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-[#0d1b3d] dark:text-white">Accessibility improvements</h3>
                  <p className="mt-1 text-sm leading-7 text-[#53617b] dark:text-[#94a3b8]">Keyboard navigation, clear focus handling and optional tools that read page content aloud.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl border border-[#e1e5ef] bg-[#f9faff] p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
                <MessageCircle className="mt-1 shrink-0 text-[#5c50ec] dark:text-[#a9a2ff]" size={25} aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-[#0d1b3d] dark:text-white">Help when it is needed</h3>
                  <p className="mt-1 text-sm leading-7 text-[#53617b] dark:text-[#94a3b8]">The chatbot interface offers help while people browse. Its answers depend on the service configured for the site.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl border border-[#e1e5ef] bg-[#f9faff] p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
                <ClipboardCheck className="mt-1 shrink-0 text-[#5c50ec] dark:text-[#a9a2ff]" size={25} aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-[#0d1b3d] dark:text-white">Responsibilities by role</h3>
                  <p className="mt-1 text-sm leading-7 text-[#53617b] dark:text-[#94a3b8]">Different workspaces help users find the tools relevant to their tasks.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="value-heading" className="px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px]">
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#5c50ec] dark:text-[#a9a2ff]">Why choose CMT?</p>
            <h2 id="value-heading" className="mt-3 text-3xl font-bold tracking-[-.04em] text-[#0d1b3d] dark:text-white sm:text-4xl">
              Less admin for organisers. Clearer information for everyone.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { title: "Keep things together", detail: "Keep conference details, submissions and registrations in one place instead of across different files." },
                { title: "Useful across campus", detail: "A faculty research conference or a student chapter summit can use the same core tools." },
                { title: "Know what is happening", detail: "Organisers and authorised staff can check registrations, submissions and available reports." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#e1e5ef] bg-white p-6 dark:border-[#1e293b] dark:bg-[#0f172a]">
                  <CheckCircle2 size={22} className="text-[#5c50ec] dark:text-[#a9a2ff]" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold text-[#0d1b3d] dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#53617b] dark:text-[#94a3b8]">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="cta-heading" className="bg-white px-5 pb-20 pt-4 dark:bg-[#0a0f1f] sm:pb-24">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-7 rounded-[22px] bg-gradient-to-br from-[#111e4b] to-[#342b87] p-7 text-white shadow-[0_25px_60px_rgba(20,28,80,.18)] sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.1em] text-[#c4bdff]"><Sparkles size={17} aria-hidden="true" /> Find a conference</p>
              <h2 id="cta-heading" className="mt-3 text-2xl font-bold tracking-[-.04em] sm:text-4xl">See what is happening on CMT.</h2>
              <p className="mt-3 max-w-[650px] text-base leading-7 text-white/80">
                Looking for a university conference, a student society event or an industry gathering? Explore the conferences listed on CMT.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                to="/conferences"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#192354] motion-safe:transition-colors hover:bg-[#efedff] ${FOCUS_RING}`}
              >
                Explore conferences <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                to="/contact"
                className={`inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white motion-safe:transition-colors hover:bg-white/10 ${FOCUS_RING}`}
              >
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#07132f] text-white/75">
        <div className="mx-auto flex min-h-[112px] max-w-[1200px] flex-col justify-center gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <LogoFallback />
            <p className="mt-1 text-xs text-white/60">Conference Management Tool</p>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} CMT. Conference Management Tool.</p>
        </div>
      </footer>
    </div>
  );
}

function LogoFallback() {
  return (
    <div className="flex items-center gap-3 text-white">
      <img className="h-9 w-9 object-contain" src="/cmt-mark.png" alt="" aria-hidden="true" />
      <div className="flex flex-col leading-tight">
        <strong className="text-xl tracking-[-.04em]">CMT</strong>
        <span className="text-xs text-white/70">Conference Management Tool</span>
      </div>
    </div>
  );
}