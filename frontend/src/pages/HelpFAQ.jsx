import { useState } from 'react';
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

// Emoji shown next to each category heading
const categoryIcons = {
  "Account": "👤",
  "Authors & Submissions": "📝",
  "Attending Conferences": "🎟️",
  "Community": "💬",
  "Getting Help": "❓",
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
    <div className="site">
      <Navbar />

      <main className="faq-page">
        <div className="container">

          {/* Logo above the title, same image used in the site footer */}
          <img
            className="faq-logo"
            src="/cmt-mark.png"
            alt="CMT logo"
          />

          <h1 className="faq-title">Help & FAQ</h1>
          <p className="faq-subtitle">
            Find answers to common questions about the conference.
          </p>

          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="faq-search"
          />

          <div className="faq-toolbar">
            <button onClick={expandAll}>Expand All</button>
            <button onClick={collapseAll}>Collapse All</button>
          </div>

          {groupedFAQs.length === 0 && (
            <p className="faq-no-results">No questions match your search.</p>
          )}

          {groupedFAQs.map((group) => (
            <div key={group.category} className="faq-category">
              <h2 className="faq-category-heading">
                <span>{categoryIcons[group.category] || "📌"}</span>
                {group.category}
              </h2>

              <div className="faq-items">
                {group.items.map((item) => {
                  const index = faqData.indexOf(item);
                  const isOpen = openIndex === 'ALL' || openIndex === index;

                  return (
                    <div key={index} className="faq-item">
                      <button
                        className="faq-question"
                        onClick={() => toggleFAQ(index)}
                      >
                        <span>{item.question}</span>
                        <span className="faq-toggle-icon">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="faq-answer">{item.answer}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="faq-contact">
            <p>Still need help?</p>
            <Link to="/contact" className="faq-contact-btn">Contact Support</Link>
          </div>

        </div>
      </main>
    </div>
  );
}

export default HelpFAQ;



    