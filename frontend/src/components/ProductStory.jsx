import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  FileCheck2,
  FileText,
  GraduationCap,
  Landmark,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

const journey = [
  {
    number: "01",
    icon: <CalendarCheck2 size={20} />,
    title: "Create or discover",
    text: "Organisers publish opportunities while researchers find relevant conferences in one place.",
  },
  {
    number: "02",
    icon: <FileText size={20} />,
    title: "Register or submit",
    text: "Attendees register and authors submit abstracts, proposals or papers securely.",
  },
  {
    number: "03",
    icon: <FileCheck2 size={20} />,
    title: "Review with confidence",
    text: "Organisers assign reviewers and manage structured peer review in a controlled workflow.",
  },
  {
    number: "04",
    icon: <MessageSquareText size={20} />,
    title: "Decide and communicate",
    text: "Send decisions, reminders and announcements without relying on scattered messages.",
  },
  {
    number: "05",
    icon: <Sparkles size={20} />,
    title: "Deliver and improve",
    text: "Manage programmes, registrations and reporting from one source of truth.",
  },
];

const audiences = [
  {
    icon: <GraduationCap size={23} />,
    title: "For researchers",
    text: "Find opportunities, submit your work, follow progress and build meaningful academic connections.",
    colour: "bg-[#efedff] text-[#5c50ec]",
  },
  {
    icon: <UsersRound size={23} />,
    title: "For organisers",
    text: "Coordinate submissions, reviewers, attendees, deadlines, sessions and announcements in one workspace.",
    colour: "bg-[#eaf9f2] text-[#15935c]",
  },
  {
    icon: <Landmark size={23} />,
    title: "For institutions",
    text: "Run professional research events with governance, role controls, reporting and a clear audit trail.",
    colour: "bg-[#eef5fd] text-[#1d6ac2]",
  },
];

const trustPoints = [
  "Role-based workspaces for every stakeholder",
  "Secure submissions and controlled review workflows",
  "Multi-factor authentication and account protection",
  "Notifications, templates and audit records",
  "Reporting for conferences, submissions and registrations",
  "Built for academic and professional events",
];

export default function ProductStory({ onExplore, onCreate }) {
  return (
    <>
      <section id="how-it-works" className="bg-[#f7f9fc] px-5 py-24">
        <div className="mx-auto w-[min(1200px,100%)]">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#5c50ec]">
              <Sparkles size={15} />
              How CMT works
            </span>
            <h2 className="mt-3 text-[clamp(31px,4vw,48px)] font-extrabold leading-tight tracking-[-.05em] text-[#0d1b3d]">
              From first call for papers to final programme.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-[#66728b]">
              CMT brings every stage of a conference into one connected flow,
              replacing disconnected emails, spreadsheets, forms and chats.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {journey.map((step) => (
              <article
                key={step.number}
                className="relative overflow-hidden rounded-[20px] border border-[#e3e8f1] bg-white p-6 shadow-[0_8px_22px_rgba(15,28,65,.035)]"
              >
                <span className="absolute right-5 top-4 text-4xl font-extrabold text-[#eeecff]">
                  {step.number}
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#efedff] text-[#5c50ec]">
                  {step.icon}
                </span>
                <h3 className="mt-7 text-[17px] font-extrabold tracking-[-.025em] text-[#17264a]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-[#73809a]">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-24">
        <div className="mx-auto w-[min(1200px,100%)]">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#5c50ec]">
                Built for every stakeholder
              </span>
              <h2 className="mt-3 text-[clamp(30px,3.7vw,45px)] font-extrabold leading-tight tracking-[-.05em] text-[#0d1b3d]">
                One platform.
                <span className="block text-[#6655f6]">
                  A better experience for everyone.
                </span>
              </h2>
              <p className="mt-5 max-w-md text-[14px] leading-7 text-[#66728b]">
                CMT gives each person the right tools, information and actions
                for their part of the conference journey.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {audiences.map((audience) => (
                <article
                  key={audience.title}
                  className="rounded-[20px] border border-[#e4e8f0] bg-[#fcfdff] p-6"
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-2xl ${audience.colour}`}
                  >
                    {audience.icon}
                  </span>
                  <h3 className="mt-6 text-[16px] font-extrabold text-[#18274a]">
                    {audience.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#71809a]">
                    {audience.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fc] px-5 py-24">
        <div className="mx-auto grid w-[min(1200px,100%)] gap-8 rounded-[28px] bg-[#0a1740] p-8 text-white shadow-[0_24px_60px_rgba(7,19,47,.18)] md:grid-cols-[1fr_.95fr] md:p-12">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#b9b3ff]">
              <Building2 size={15} />
              Built for institutions
            </span>
            <h2 className="mt-4 max-w-xl text-[clamp(29px,3.6vw,44px)] font-extrabold leading-tight tracking-[-.05em]">
              Professional conferences, without the operational chaos.
            </h2>
            <p className="mt-5 max-w-xl text-[14px] leading-7 text-white/70">
              CMT helps universities, research groups and professional bodies
              manage research days, faculty symposiums, innovation summits and
              academic conferences through one accountable system.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onExplore}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[13px] font-extrabold text-[#182551] transition hover:-translate-y-0.5"
              >
                Explore conferences
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={onCreate}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-[13px] font-extrabold text-white transition hover:bg-white/10"
              >
                Create a conference
              </button>
            </div>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-white/[.06] p-6">
            <span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#b9b3ff]">
              Why organisations choose CMT
            </span>

            <div className="mt-5 grid gap-4">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-[#56d39a]"
                  />
                  <span className="text-[13px] leading-6 text-white/80">
                    {point}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="flex items-center gap-2 text-[12px] font-bold text-white">
                <ShieldCheck size={17} className="text-[#8b7eff]" />
                Designed around secure, role-based access.
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
