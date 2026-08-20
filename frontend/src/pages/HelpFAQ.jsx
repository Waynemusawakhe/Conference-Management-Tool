import { useState } from 'react';
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { FileText, HelpCircle, MessagesSquare, Search, Ticket, UserRound } from "lucide-react";

const categoryIcons = {
  "Account": UserRound,
  "Authors & Submissions": FileText,
  "Attending Conferences": Ticket,
  "Community": MessagesSquare,
  "Getting Help": HelpCircle,
};

// All FAQ content lives here — grouped by category.
const faqData = [
  {
    category: "Account",
    question: "Do I need an account to browse conferences?",
    answer: "No, anyone can browse and filter conferences by name and location without logging in."
  },
  {
    category: "Account",
    question: "How do I register an account?",
    answer: "Click 'Register' and fill in your details. You'll get an email to verify your account."
  },
  {
    category: "Account",
    question: "How do I reset my password?",
    answer: "Use the forgot password link on the login page and a reset link will be sent to you."
  },
  {
    category: "Authors & Submissions",
    question: "How do I submit a proposal as an Author?",
    answer: "Log in as an Author, choose a conference, and click 'Submit Proposal'."
  },
  {
    category: "Authors & Submissions",
    question: "How do I check my submission status?",
    answer: "Go to 'My Proposals' to see each submission's status."
  },
  {
    category: "Attending Conferences",
    question: "How do I register for a conference?",
    answer: "Log in and click 'Register' on the conference page."
  },
  {
    category: "Attending Conferences",
    question: "Can I cancel my registration?",
    answer: "Yes, go to 'My Conferences' and cancel it."
  },
  {
    category: "Community",
    question: "Can I leave a testimonial?",
    answer: "Yes, any logged-in user can post a testimonial about their experience using CMT."
  },
  {
    category: "Getting Help",
    question: "Who do I contact for help?",
    answer: "Use the Contact Us page to send a message, no login required."
  },
];

function HelpFAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const expandAll = () => setOpenIndex('ALL');
  const collapseAll = () => setOpenIndex(null);

  const filteredFAQs = faqData.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFAQs = filteredFAQs.reduce((groups, item) => {
    const existing = groups.find((g) => g.category === item.category);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ category: item.category, items: [item] });
    }
    return groups;
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d] transition-colors dark:bg-[#07132f] dark:text-white">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_75%_32%,rgba(98,83,245,.2),transparent_27%),linear-gradient(135deg,#07132f_0%,#0a1740_52%,#15165a_100%)] px-5 py-16 text-white sm:py-20">
          <div className="relative z-10 mx-auto grid w-[min(1100px,100%)] items-center gap-10 lg:grid-cols-[1fr_.8fr]">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#b9b3ff]"><HelpCircle size={15} /> Support centre</span>
              <h1 className="mt-4 max-w-[680px] text-[clamp(38px,5vw,62px)] font-bold leading-[1.02] tracking-[-.055em]">Answers that keep your work moving.</h1>
              <p className="mt-5 max-w-[590px] text-sm leading-7 text-white/65">Find clear guidance for accounts, submissions, conference participation and the CMT workflow.</p>
            </div>
            <div className="cmt-float hidden justify-self-end rounded-[22px] border border-white/15 bg-white/10 p-6 backdrop-blur lg:block"><Search className="text-[#b9b3ff]" size={54} strokeWidth={1.2} /></div>
          </div>
        </section>

        <section className="bg-[#f7f9fc] px-5 py-14 dark:bg-[#07132f] sm:py-20">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-8">
          <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5c50ec]">Knowledge base</span>
          <h2 className="mt-2 text-3xl font-bold tracking-[-.04em] dark:text-white">Help & FAQ</h2>
          <p className="mt-2 text-sm leading-7 text-[#66728b] dark:text-white/65">Search the answers or browse by workflow area.</p>
          </div>

          <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#71809a]" size={18} />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-[#dfe4ed] bg-white py-3 pl-11 pr-4 text-sm outline-none shadow-sm focus:border-[#7568f7] focus:ring-4 focus:ring-[#7568f7]/10 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45"
          />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button className="rounded-lg border border-[#dfe4ed] bg-white px-3 py-2 text-xs font-bold text-[#5c50ec] dark:border-white/10 dark:bg-white/10 dark:text-[#b9b3ff]" onClick={expandAll}>Expand All</button>
            <button className="rounded-lg border border-[#dfe4ed] bg-white px-3 py-2 text-xs font-bold text-[#5c50ec] dark:border-white/10 dark:bg-white/10 dark:text-[#b9b3ff]" onClick={collapseAll}>Collapse All</button>
          </div>

          {groupedFAQs.length === 0 && (
            <p className="mt-8 rounded-xl border border-dashed border-[#ccd3df] bg-white p-8 text-center text-sm text-[#66728b]">No questions match your search.</p>
          )}

          {groupedFAQs.map((group) => (
            <div key={group.category} className="mt-10">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold dark:text-white">
                {(() => { const Icon = categoryIcons[group.category] || HelpCircle; return <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#efedff] text-[#5c50ec]"><Icon size={16} /></span>; })()}
                {group.category}
              </h2>

              <div className="overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-sm dark:border-white/10 dark:bg-white/[.06]">
                {group.items.map((item) => {
                  const index = faqData.indexOf(item);
                  const isOpen = openIndex === 'ALL' || openIndex === index;

                  return (
                    <div key={index} className="border-b border-[#e8ebf2] last:border-b-0">
                      <button
                        className="flex w-full items-center justify-between gap-4 border-0 bg-transparent px-5 py-4 text-left text-sm font-bold text-[#0d1b3d] hover:bg-[#fafbfe] dark:text-white dark:hover:bg-white/10"
                        onClick={() => toggleFAQ(index)}
                      >
                        <span>{item.question}</span>
                        <span className="text-xl font-normal text-[#5c50ec]">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 text-sm leading-7 text-[#66728b] dark:text-white/65">{item.answer}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-12 flex items-center justify-between gap-5 rounded-2xl bg-[#091634] p-6 text-white sm:px-8">
            <p className="m-0 text-sm font-bold">Still need help?</p>
            <Link to="/contact" className="rounded-[11px] bg-white px-4 py-3 text-xs font-bold text-[#192354]">Contact Support</Link>
          </div>

        </div>
        </section>
      </main>
    </div>
  );
}

export default HelpFAQ;



    