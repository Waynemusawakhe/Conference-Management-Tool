import { useState } from 'react';

const categoryIcons = {
  "Account": "👤",
  "Authors & Submissions": "📝",
  "Attending Conferences": "🎟️",
  "Community": "💬",
  "Getting Help": "❓",
};

const faqData = [
{
    category : "Account",
    question: "Do I need an account to browse conferences?",
    answer: "No, anyone can browse and filter conferences by name and location without logging in."
},
  {
    category : "Account",
    question: "How do I register an account?",
    answer: "Click 'Register' and fill in your deatils. You will get an email to verify your account."
  },
  {
    category : "Account",
    question: "How I reset my password?",
    answer: "Use the forgot password link on the login page and reset link will be sent to you."
  },
  {
    category: "Authors & Submissions",
    question: "How do I submit a proposal as an Author?",
    answer: "Log in as an Author, choose a conference, and click 'Submit Proposal'."
  },
  {
    category: "Authors & Submissions",
    question: "How do I check my submission status?",
    answer: "Go to 'My Proposals' to see each submission's status"
  },
  {
    category: "Attending Conferences",
    question: "How do I register for a conference attendance?",
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
    answer: "Yes, you can post a testimonial about your experience."
  },
  
  {
    category: "Getting Help",
    question: "Who do I contact for help?",
    answer: "Link contact us page..."
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

  const filteredFAQs = faqData.filter((item) =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CATEGORY ORDER
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-2">Help & FAQ</h1>
        <p className="text-slate-600 mb-6">
          Find answers to common questions about the conference.
        </p>

        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-xl border border-purple-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                />

        <div className="flex gap-3 mb-8">
          <button
            onClick={expandAll}
            className="text-sm px-4 py-1.5 rounded-full border border-purple-300 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-sm px-4 py-1.5 rounded-full border border-purple-300 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            Collapse All
          </button>
        </div>

        {
            groupedFAQs.length === 0 && (
            <p className="text-slate-500 text-center py-6">
              No questions match your search.
            </p>
        )}
        {
            groupedFAQs.map((group) => (
                <div key={group.category} className="mb-8">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-3">
                        <span className="text-base">{categoryIcons[group.category] || "📌"}</span>
                        {group.category}
                    </h2>
                    <div className= "space-y-3">
                        {group.items.map((item) => {
           const index = faqData.indexOf(item);
            const isOpen = openIndex === 'ALL' || openIndex === index;
            return (

            <div
              key={index}
              className="border border-purple-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center text-left px-5 py-4 bg-white hover:bg-purple-50 transition-colors"
              >
                <span className="font-medium text-indigo-900">
                  {item.question}
                </span>
                <span className="text-purple-600 text-xl ml-4 shrink-0">
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 text-slate-700 border-t border-purple-100">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
    </div>
</div>
))}

        <div className="mt-10 text-center">
        <p className= "text-slate-500 text-sm mb-3">
          Still need help?
          </p>
          <button className= "px-6 py-2.5 rounded-full bg-gradient-to-r from-indingo-600 to-purple-600 text-white font-medium shadow-sm hover:shadow-md transition-shadow">
            Contact support
            </button>
        </div>
      </div>
    </div>
  );
}

export default HelpFAQ;



    