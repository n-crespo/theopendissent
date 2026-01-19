import { ScrollableRail } from "../components/ui/ScrollableRail";
import { Chip } from "../components/ui/Chip";
import { useNavigate } from "react-router-dom";

export const Privacy = () => {
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

      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last Updated: January 2026</p>

      <div className="space-y-6 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p>
            The Open Dissent ("we," "our," or "us") is committed to protecting
            your privacy. This Privacy Policy explains how we collect, use, and
            safeguard your information when you use our website and services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            2. Information We Collect
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Authentication Data:</strong> We use Google Firebase
              Authentication. When you sign in, we receive your email address
              and a unique ID. We use your email{" "}
              <strong>strictly for authentication</strong> and account security.
              It is never displayed publicly.
            </li>
            <li>
              <strong>User-Generated Content:</strong> Posts, replies, and
              stance interactions you create are stored in our database and are
              publicly visible. These are linked to your anonymous ID, not your
              real name or email.
            </li>
            <li>
              <strong>Usage Data:</strong> We may collect anonymous metrics
              (e.g., number of active users) to improve system performance.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            3. How We Use Your Information
          </h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Provide and maintain the Service.</li>
            <li>Prevent abuse and enforce our Terms of Service.</li>
            <li>Allow you to create and manage anonymous content.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            4. Third-Party Services
          </h2>
          <p>
            We use <strong>Google Firebase</strong> for hosting, database, and
            authentication services. Their privacy practices are governed by the
            Google Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Contact Us</h2>
          <p>
            If you have questions about this policy, please contact us at
            theopendissent@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
};
