import { useState } from 'react';

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
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-950 mb-2">Help & FAQ</h1>
        <p className="text-slate-600 mb-6">
          Find answers to common questions about the conference.
        </p>

        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-8 px-4 py-3 rounded-lg border border-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-900/40 bg-white"
        />

        {
            groupedFAQs.length === 0 && (
            <p className="text-slate-500 text-center py-6">
              No questions match your search.
            </p>
        )}
        {
            groupedFAQs.map((group) => (
                <div key={group.category} className="mb-8">
                    <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-3">
                        {group.category}
                    </h2>
                    <div className= "space-y-3">
                        {group.items.map((item) => {
            const index = faqData.indexOf(item);
            return (

            <div
              key={index}
              className="border border-blue-900/20 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center text-left px-5 py-4 bg-white hover:bg-blue-50 transition-colors"
              >
                <span className="font-medium text-blue-950">
                  {item.question}
                </span>
                <span className="text-blue-900 text-xl ml-4 shrink-0">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>

              {openIndex === index && (
                <div className="px-5 py-4 bg-blue-50 text-slate-700 border-t border-blue-900/10">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
    </div>
</div>
))}

        <div className="mt-10 text-center text-slate-500 text-sm">
          Still need help?{' '}
          <span className="text-blue-900 font-medium">Contact support</span>
        </div>
      </div>
    </div>
  );
}

export default HelpFAQ;



    