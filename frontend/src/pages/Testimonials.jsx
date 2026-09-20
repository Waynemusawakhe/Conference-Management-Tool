import Navbar from "../components/Navbar";
import { Quote, Star, ArrowRight,  } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "CMT cut the time I spend hunting for relevant conferences from a full afternoon to about ten minutes. The topic filters actually understand my field.",
    name: "Dr. Amara Osei",
    role: "AI & Machine Learning · Cape Town",
    initials: "AO",
    rating: 5,
  },
  {
    quote: "I submitted to three conferences through CMT this year and tracked every deadline in one place. No more spreadsheets duct-taped together.",
    name: "Priya Nair",
    role: "Computer Science PhD Candidate · Durban",
    initials: "PN",
    rating: 5,
  },
  {
    quote: "As a first-time presenter, the reviewer feedback loop inside CMT made the whole process far less intimidating. I knew exactly where my submission stood.",
    name: "Lucas Ferreira",
    role: "Mechanical Engineering · New York",
    initials: "LF",
    rating: 4,
  },
  {
    quote: "Our department now runs its annual symposium entirely through CMT — registrations, reviewer assignment, and the schedule builder saved us weeks.",
    name: "Dr. Helen Whitfield",
    role: "Medicine & Public Health · London",
    initials: "HW",
    rating: 5,
  },
  {
    quote: "The researcher-matching feature connected me with two collaborators at a conference I almost skipped. That single introduction shaped my next paper.",
    name: "Kenji Watanabe",
    role: "Education Research · Vanderbjilpark",
    initials: "KW",
    rating: 5,
  },
  {
    quote: "Clean, fast, and it doesn't try to do a hundred things badly. It does conference discovery and submissions well, which is what I actually needed.",
    name: "Grace Mensah",
    role: "Engineering Undergraduate · Welkom",
    initials: "GM",
    rating: 4,
  },
];

function TestimonialCard({ item }) {
  return (
    <div className="testimonial-card">
      <Quote className="quote-icon" />
      <p className="testimonial-text">{item.quote}</p>

      <div className="testimonial-stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={i < item.rating ? "star-filled" : "star-empty"}
          />
        ))}
      </div>

      <div className="testimonial-footer">
        <span className="testimonial-initials">{item.initials}</span>
        <div>
          <p className="testimonial-name">{item.name}</p>
          <p className="testimonial-role">{item.role}</p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <div className="site">
      <Navbar />

      <main className="testimonials-page">
        {/* Hero */}
        <section className="testimonials-hero">
          <h1>
            Trusted by researchers, <span className="highlight">worldwide.</span>
          </h1>
          <p>
            From first-time presenters to symposium organizers, here's how CMT
            has changed the way people find, submit to, and run conferences.
          </p>
        </section>

    

        {/* Testimonials Grid */}
        <section className="testimonials-grid">
          {TESTIMONIALS.map((item) => (
            <TestimonialCard key={item.name} item={item} />
          ))}
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2>Ready to join them?</h2>
          <p>
            Create a free account and start discovering conferences matched
            to your research in minutes.
          </p>
          <button className="cta-button">
            Register for free <ArrowRight className="icon" />
          </button>
        </section>
      </main>
    </div>
  );
}
