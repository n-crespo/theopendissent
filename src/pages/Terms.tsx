import { ScrollableRail } from "../components/ui/ScrollableRail";
import { Chip } from "../components/ui/Chip";
import { useNavigate } from "react-router-dom";

export const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-slate-800">
      <div className="mb-6">
        <ScrollableRail>
          <Chip
            onClick={() => navigate("/")}
            icon={<i className="bi bi-arrow-left"></i>}
          >
            Back to Home
          </Chip>
        </ScrollableRail>
      </div>

      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last Updated: January 2026</p>

      <div className="space-y-6 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using The Open Dissent, you agree to be bound by
            these Terms. If you disagree with any part of the terms, you may not
            access the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            2. User Conduct & Content
          </h2>
          <p>
            You are responsible for the content you post. The Open Dissent is a
            platform for free speech, but we strictly prohibit:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Hate speech, harassment, or threats of violence.</li>
            <li>Spam, automated posts, or malicious content.</li>
            <li>Illegal activities or promotion of illegal acts.</li>
          </ul>
          <p className="mt-2">
            We reserve the right to remove any content or terminate accounts
            that violate these guidelines at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Anonymity</h2>
          <p>
            While we protect your identity on the public feed, you are
            responsible for maintaining the security of your account. Do not
            share your login credentials.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            4. Limitation of Liability
          </h2>
          <p>
            The Open Dissent is provided on an "AS IS" and "AS AVAILABLE" basis.
            We are not liable for any content posted by users or for any damages
            resulting from the use of our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued
            use of the service constitutes acceptance of the new terms.
          </p>
        </section>
      </div>
    </div>
  );
};
