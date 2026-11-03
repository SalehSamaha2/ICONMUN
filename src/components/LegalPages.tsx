import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText, Lock, Users, AlertTriangle, Eye, Mail, CheckCircle2 } from 'lucide-react';

export type LegalTab = 'privacy' | 'terms';

interface LegalPagesProps {
  initialTab?: LegalTab;
  onBack?: () => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({
  initialTab = 'privacy',
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.assign('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0408] text-[#F3ECE4] selection:bg-[#E8CBA4]/20 selection:text-[#FFF5E8] font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#E8CBA4]/15 bg-[#14060E]/90 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D8C5C5] hover:text-[#FFF5E8] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-[#E8CBA4]" />
            <span>Return to ICON MUN</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-cinzel text-xs font-bold uppercase tracking-[0.25em] text-[#E8CBA4]">
              ICON MUN 2027
            </span>
            <span className="text-[#8D737A]">·</span>
            <span className="text-[10px] uppercase tracking-wider text-[#A89D8A]">
              Governance & Compliance
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E8CBA4]/25 bg-[#E8CBA4]/5 text-[#E8CBA4] text-[10px] uppercase tracking-[0.25em]">
            <Shield className="h-3 w-3" />
            <span>Official Policy Directorate</span>
          </div>
          <h1 className="font-cinzel text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em] text-[#FFF5E8]">
            Legal, Privacy & Compliance
          </h1>
          <p className="text-xs sm:text-sm text-[#A89D8A] max-w-xl mx-auto font-light">
            Standards for data protection, participant safety, parental consent for minors, and conference governance for ICON MUN 2027.
          </p>

          {/* Tab Selector */}
          <div className="pt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer border ${
                activeTab === 'privacy'
                  ? 'border-[#E8CBA4] bg-[#E8CBA4]/20 text-[#FFF5E8] shadow-[0_0_20px_rgba(212,175,106,0.15)]'
                  : 'border-[#E8CBA4]/15 bg-[#14060E] text-[#D8C5C5] hover:border-[#E8CBA4]/30'
              }`}
            >
              <Lock className="h-3.5 w-3.5 text-[#E8CBA4]" />
              <span>Privacy & Minor Data Protection</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer border ${
                activeTab === 'terms'
                  ? 'border-[#E8CBA4] bg-[#E8CBA4]/20 text-[#FFF5E8] shadow-[0_0_20px_rgba(212,175,106,0.15)]'
                  : 'border-[#E8CBA4]/15 bg-[#14060E] text-[#D8C5C5] hover:border-[#E8CBA4]/30'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-[#E8CBA4]" />
              <span>Terms of Participation & Code of Conduct</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Privacy Policy */}
        {activeTab === 'privacy' && (
          <article className="rounded-2xl border border-[#E8CBA4]/20 bg-[#14060E]/70 p-6 sm:p-10 space-y-8 leading-relaxed text-xs sm:text-sm text-[#D8C5C5]">
            <div className="border-b border-[#E8CBA4]/15 pb-4">
              <span className="text-[10px] uppercase font-mono text-[#E8CBA4] tracking-widest">Document ref: POL-PRIV-2027-V1</span>
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#FFF5E8] mt-1">
                Privacy Policy & Applicant Data Protection
              </h2>
              <p className="text-[11px] text-[#8D737A] mt-1">Effective Date: November 2026 · ICON MUN Directorate</p>
            </div>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">1.</span> Scope & Data Controller
              </h3>
              <p>
                This Privacy Policy applies to all individuals registering for, applying to, or attending ICON MUN 2027, including delegates, student officers, volunteers, security personnel, and media staff. The High Secretariat of ICON MUN serves as the designated data controller for all participant information collected through this website.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">2.</span> Categories of Data Collected
              </h3>
              <p>
                To organize a safe, orderly, and academic diplomatic simulation, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#D8C5C5]/90">
                <li><strong className="text-[#FFF5E8]">Identity & Contact:</strong> Full legal or school name, personal email address, institutional affiliation (school or university), and personal mobile number.</li>
                <li><strong className="text-[#FFF5E8]">Demographic & Eligibility Details:</strong> Gender, academic grade level (e.g. Grades 9–12 or university), and date of birth to ensure age-appropriate committee placement and conference badging.</li>
                <li><strong className="text-[#FFF5E8]">Emergency Safeguarding:</strong> Emergency contact telephone numbers and relationship to the applicant (e.g., parent, guardian).</li>
                <li><strong className="text-[#FFF5E8]">Substantive Submissions:</strong> Council preferences, country allotment requests, motivational statements, and role-specific questionnaire answers.</li>
                <li><strong className="text-[#FFF5E8]">Access & Verification Records:</strong> Secure QR pass tokens, check-in timestamps, and security scan audit entries.</li>
              </ul>
            </section>

            <section className="space-y-3 rounded-xl border border-amber-400/30 bg-amber-500/[0.05] p-4 sm:p-5">
              <div className="flex items-center gap-2 text-amber-300 font-bold font-cinzel text-sm sm:text-base">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>3. Protection of Minors & Parental/Guardian Consent</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                A substantial portion of ICON MUN applicants and delegates are secondary school students under the age of 18 (minors). By submitting an application, any applicant under 18 years of age confirms that their parent, legal guardian, or responsible faculty advisor is aware of and has authorized their participation and the collection of necessary contact and emergency details. Emergency contact numbers are strictly designated for safeguarding and urgent event contact.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">4.</span> Lawful Purpose & Data Use
              </h3>
              <p>Personal data is processed exclusively for:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#D8C5C5]/90">
                <li>Reviewing and allocating delegate seats and departmental team appointments.</li>
                <li>Generating unique encrypted digital QR admission passes for venue access control.</li>
                <li>Facilitating official communications regarding committee background guides, schedules, and accreditation.</li>
                <li>Verifying physical check-in status at the venue perimeter to ensure safety.</li>
              </ul>
              <p className="text-xs text-[#8D737A]">
                We do not sell, license, monetize, or disclose applicant data to commercial third parties, marketers, or advertisers.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">5.</span> Security Architecture & Access Control
              </h3>
              <p>
                All data is stored in enterprise-grade database facilities (PostgreSQL on Supabase) utilizing Row Level Security (RLS) policies. Public anonymous users can only submit applications; reading, filtering, updating, and exporting applicant data is strictly restricted to authenticated Secretariat leadership. Pass verification is decoupled from raw applicant profiles through cryptographic UUID tokens and passwordless OTP verification.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">6.</span> Retention & Deletion
              </h3>
              <p>
                Application records and attendance scan history are retained for the active preparatory cycle and duration of ICON MUN 2027. Following the completion of post-conference accreditation and certificate issuance, records are securely archived or purged according to organizational retention standards.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">7.</span> Participant Rights & Privacy Inquiries
              </h3>
              <p>
                Applicants and parents/guardians retain the right to inspect, correct, or request the deletion of their personal information at any time prior to the conference by contacting the Secretariat Chancellery.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#E8CBA4]">
                <Mail className="h-4 w-4" />
                <span>Direct Privacy Requests: secretariat@iconmun.org</span>
              </div>
            </section>
          </article>
        )}

        {/* Tab 2: Terms of Participation */}
        {activeTab === 'terms' && (
          <article className="rounded-2xl border border-[#E8CBA4]/20 bg-[#14060E]/70 p-6 sm:p-10 space-y-8 leading-relaxed text-xs sm:text-sm text-[#D8C5C5]">
            <div className="border-b border-[#E8CBA4]/15 pb-4">
              <span className="text-[10px] uppercase font-mono text-[#E8CBA4] tracking-widest">Document ref: POL-TOC-2027-V1</span>
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#FFF5E8] mt-1">
                Terms of Participation & Code of Conduct
              </h2>
              <p className="text-[11px] text-[#8D737A] mt-1">Conference Governance · ICON MUN 2027</p>
            </div>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">1.</span> Academic Simulation & Non-Affiliation Notice
              </h3>
              <p>
                ICON MUN is an independent educational simulation of multilateral diplomacy organized by students for academic development. ICON MUN is not a formal organ, subsidiary, or official agency of the United Nations. All council simulations, resolutions, and directives represent educational discourse.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">2.</span> Participant Code of Conduct
              </h3>
              <p>
                All participants (delegates, student officers, chairs, volunteers, and guests) must maintain the highest standards of diplomatic decorum, integrity, and mutual respect. ICON MUN maintains zero tolerance for harassment, discrimination, hate speech, bullying, or disruptive conduct. The High Secretariat reserves the sovereign authority to revoke accreditation and revoke venue access for any participant violating this code.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">3.</span> Chatham House Rule
              </h3>
              <p>
                To foster candid, intellectually rigorous debate, committee proceedings are observed under the spirit of the Chatham House Rule: participants are free to use information received during debate, but neither the identity nor the school affiliation of any speaker may be revealed outside committee chambers.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">4.</span> Photo, Audio, and Video Media Release
              </h3>
              <p>
                By attending ICON MUN, participants acknowledge that official Media Department personnel will photograph, record, and document plenary assemblies, ceremony halls, and committee sessions. These assets may be utilized in official conference archives, retrospective videos, and educational publications. Any participant wishing to opt out of featured photographic portraits must inform the Secretariat Chancellery upon check-in.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">5.</span> Admission, QR Badging & Venue Security
              </h3>
              <p>
                Entry into conference venues requires an authorized digital QR pass issued to a verified email address. Passes are non-transferable and may not be shared, duplicated, or photographed for unauthorized admission. Security personnel are authorized to verify passes at all entrance and perimeter checkpoints.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-cinzel text-base font-bold text-[#FFF5E8] flex items-center gap-2">
                <span className="text-[#E8CBA4]">6.</span> Registration Fees & Refund Policy
              </h3>
              <p>
                Submission of an interest registration or departmental staff application is free of charge. In the event that conference badging fees, institutional delegation pack fees, or social event tickets are instituted, all fee schedules, cancellation deadlines, and refund conditions will be communicated in writing prior to payment collection.
              </p>
            </section>
          </article>
        )}

        {/* Legal Disclaimer Box */}
        <div className="rounded-xl border border-[#E8CBA4]/20 bg-[#14060E]/90 p-5 text-xs text-[#8D737A] space-y-2">
          <p className="font-semibold text-[#D8C5C5]">Legal Compliance Advisory:</p>
          <p>
            This document sets forth the administrative policies and data management principles of ICON MUN 2027. Organizers are advised to review local data protection regulations (including KSA Personal Data Protection Law / GDPR principles for international participants) with designated school or legal advisors prior to conference commencement.
          </p>
        </div>
      </main>
    </div>
  );
};
