import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import PublicFooter from "../components/PublicFooter";

export default function AccessibilityGuide() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0d1b3d]">
      <Navbar />
      <main id="cmt-main-content" className="mx-auto max-w-[850px] px-5 py-12 sm:py-16">
        <h1 className="text-3xl font-bold">Accessibility at CMT</h1>
        <p className="mt-4 leading-7">Our goal is to make conference information, registration and submissions accessible without a mouse or visual display. You can use your own screen reader; the optional Read Aloud tool is not required.</p>
        <section aria-labelledby="screen-reader-guide" className="mt-8">
          <h2 id="screen-reader-guide" className="text-xl font-bold">Use your screen reader</h2>
          <p className="mt-2 leading-7">On Windows, start NVDA and use its heading and landmark navigation. On iPhone or Mac, turn on VoiceOver. On Android, turn on TalkBack in Accessibility settings. Their built-in gestures and keyboard commands let you browse headings, links, buttons and forms.</p>
        </section>
        <section aria-labelledby="keyboard-guide" className="mt-8">
          <h2 id="keyboard-guide" className="text-xl font-bold">Keyboard navigation</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6 leading-7">
            <li>Press Tab to move to the next control, Shift+Tab to go back.</li>
            <li>Press Enter to activate links and buttons; Space also activates most buttons and checkboxes.</li>
            <li>Press Escape to close the conference comparison and registration confirmation dialogs.</li>
            <li>Press Tab at the start of a page to reveal “Skip to main content”.</li>
          </ul>
        </section>
        <section aria-labelledby="reading-guide" className="mt-8">
          <h2 id="reading-guide" className="text-xl font-bold">Reading and display settings</h2>
          <p className="mt-2 leading-7">Open the Accessibility button near the bottom-left of the page to read page text or selected text aloud, jump between headings, enlarge text, strengthen contrast or reduce animations. Audio playback requires browser speech support and starts only when you choose it.</p>
        </section>
        <section aria-labelledby="support-guide" className="mt-8">
          <h2 id="support-guide" className="text-xl font-bold">Need an accessible document or assistance?</h2>
          <p className="mt-2 leading-7">Some conference PDFs and third-party documents may not be readable by assistive technology. <Link className="font-semibold underline" to="/contact">Contact the CMT team</Link> to request an accessible alternative. Please describe which page or document is causing difficulty.</p>
        </section>
        <Link className="mt-8 inline-block font-semibold underline" to="/conferences">Browse conferences</Link>
      </main>
      <PublicFooter />
    </div>
  );
}
