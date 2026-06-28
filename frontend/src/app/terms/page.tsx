'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const LAST_UPDATED = 'June 28, 2026';

interface SectionProps {
  num: string;
  title: string;
  children: React.ReactNode;
}
function Section({ num, title, children }: SectionProps) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-black text-neutral-900 mb-4 flex items-start gap-3">
        <span className="flex-shrink-0 h-7 w-7 rounded-lg bg-amber-500 text-white text-xs font-black flex items-center justify-center mt-0.5">{num}</span>
        {title}
      </h2>
      <div className="text-sm text-neutral-600 leading-relaxed space-y-3 pl-10">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-100 px-4 py-3.5 flex items-center gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex-1 text-center">
          <span className="text-sm font-black text-neutral-900">Terms & Conditions</span>
        </div>
        <div className="h-4 w-16" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 pb-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-500 mb-5">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-neutral-900 mb-2">Vendly Terms & Conditions</h1>
          <p className="text-sm text-neutral-400">Effective Date: {LAST_UPDATED}</p>
          <p className="text-sm text-neutral-500 mt-3 max-w-lg mx-auto">
            Please read these Terms and Conditions carefully before using the Vendly platform. By accessing or using Vendly, you agree to be bound by these terms.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10">
          <p className="text-sm font-bold text-amber-800">
            IMPORTANT NOTICE: These Terms constitute a legally binding agreement between you and Vendly Technologies Ltd. ("Vendly," "we," "us," or "our"). If you do not agree to these Terms, you must not use the Platform.
          </p>
        </div>

        <Section num="1" title="Definitions and Interpretation">
          <p><strong>"Platform"</strong> means the Vendly website, mobile application, APIs, and all related software, tools, and services operated by Vendly Technologies Ltd.</p>
          <p><strong>"User"</strong> means any individual or entity that registers for, accesses, or uses the Platform, whether as a Buyer, Seller, or otherwise.</p>
          <p><strong>"Buyer"</strong> means a User who purchases or seeks to purchase Products or Services through the Platform.</p>
          <p><strong>"Seller"</strong> means a User who lists, offers, or sells Products or Services through the Platform.</p>
          <p><strong>"Product(s)"</strong> means any physical goods, digital products, or services listed for sale on the Platform.</p>
          <p><strong>"Escrow"</strong> means the secure fund-holding mechanism operated by Vendly that locks payment from a Buyer until the conditions of a transaction are satisfied.</p>
          <p><strong>"CELO"</strong> refers to the Celo blockchain native currency used for transactions on the Platform.</p>
          <p><strong>"Account"</strong> means a registered user profile created on the Platform.</p>
          <p><strong>"Content"</strong> means all text, images, videos, descriptions, reviews, and other materials submitted by Users to the Platform.</p>
          <p>References to the singular include the plural and vice versa. Headings are for convenience only and do not affect the interpretation of these Terms.</p>
        </Section>

        <Section num="2" title="Acceptance of Terms">
          <p>By registering an Account, clicking "I Agree," or otherwise accessing or using the Platform in any manner, you confirm that:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>You have read, understood, and agree to be bound by these Terms and our Privacy Policy.</li>
            <li>You are at least 18 years of age, or if you are between 13 and 17 years of age, you have obtained verifiable parental or guardian consent.</li>
            <li>You have the legal capacity to enter into a binding contract under the laws of your jurisdiction.</li>
            <li>You are not barred from using the Platform under any applicable law.</li>
            <li>If you are using the Platform on behalf of a company or other legal entity, you have the authority to bind that entity to these Terms.</li>
          </ul>
          <p>We reserve the right to modify these Terms at any time. We will provide notice of material changes via email or prominent notice on the Platform. Your continued use after such notice constitutes acceptance of the updated Terms.</p>
        </Section>

        <Section num="3" title="Account Registration and Security">
          <p><strong>3.1 Registration Requirements.</strong> To access certain features of the Platform, you must create an Account by providing accurate, complete, and current information. You agree to maintain and promptly update your Account information.</p>
          <p><strong>3.2 One Account Per Person.</strong> Each person or entity may only maintain one active Account. Creating multiple Accounts to circumvent restrictions, bans, or policies is strictly prohibited.</p>
          <p><strong>3.3 Account Security.</strong> You are solely responsible for maintaining the confidentiality of your login credentials. You agree to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use a strong, unique password for your Vendly Account.</li>
            <li>Notify us immediately at support@vendly.com if you suspect any unauthorized use of your Account.</li>
            <li>Never share your credentials with any third party.</li>
            <li>Log out of your Account at the end of each session on shared devices.</li>
          </ul>
          <p><strong>3.4 Liability.</strong> Vendly shall not be liable for any losses arising from your failure to maintain adequate Account security. You are fully responsible for all activities that occur under your Account.</p>
          <p><strong>3.5 Email Verification.</strong> You must verify your email address before accessing all Platform features. Accounts with unverified email addresses may have limited functionality.</p>
          <p><strong>3.6 Account Suspension.</strong> We reserve the right to suspend or terminate your Account at any time, with or without notice, for violation of these Terms, fraudulent activity, or any other reason we deem appropriate in our sole discretion.</p>
        </Section>

        <Section num="4" title="Vendor and Seller Obligations">
          <p><strong>4.1 Vendor Application.</strong> To sell on the Platform, you must apply to become a verified Vendor. Approval is at Vendly's sole discretion. We reserve the right to reject any application without providing reasons.</p>
          <p><strong>4.2 Listing Accuracy.</strong> Sellers represent and warrant that all Product listings are:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Accurate, complete, and not misleading.</li>
            <li>Not in violation of any applicable law, regulation, or third-party rights.</li>
            <li>Accompanied by clear, high-quality images that accurately represent the Product.</li>
            <li>Priced in CELO, with all applicable fees and costs disclosed.</li>
          </ul>
          <p><strong>4.3 Prohibited Products.</strong> Sellers may not list, sell, or offer any of the following on the Platform:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Illegal goods, substances, or services under any applicable law.</li>
            <li>Counterfeit, replica, or unauthorized goods that infringe intellectual property rights.</li>
            <li>Stolen property, hacked accounts, or goods obtained through fraud.</li>
            <li>Weapons, firearms, explosives, or dangerous materials.</li>
            <li>Controlled substances, prescription medications without authorization, or illegal drugs.</li>
            <li>Adult content, pornographic material, or sexually explicit services.</li>
            <li>Services involving personal data, hacking tools, malware, or cyberattack services.</li>
            <li>Financial instruments, securities, or investment products without appropriate regulatory authorization.</li>
            <li>Gambling services or lottery products unless expressly authorized by applicable law and Vendly.</li>
          </ul>
          <p><strong>4.4 Inventory Management.</strong> Sellers are responsible for maintaining accurate stock levels. Listing a Product you cannot fulfill is a material breach of these Terms.</p>
          <p><strong>4.5 Fulfillment Obligations.</strong> Upon receiving a paid order, Sellers must:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Process the order within the timeline disclosed in the listing.</li>
            <li>Ship physical goods using a trackable shipping method.</li>
            <li>Update the order status promptly on the Platform.</li>
            <li>Communicate proactively with Buyers about any delays.</li>
          </ul>
          <p><strong>4.6 Fees.</strong> Vendly charges a platform commission on completed sales. The current commission rates are published on our Seller Help Center and may be updated from time to time with 30 days' notice.</p>
          <p><strong>4.7 Taxes.</strong> Sellers are solely responsible for determining, collecting, and remitting all applicable taxes, duties, and levies on their sales. Vendly does not provide tax advice.</p>
        </Section>

        <Section num="5" title="Escrow and Payment System">
          <p><strong>5.1 How Escrow Works.</strong> Vendly operates a three-stage milestone escrow system to protect both Buyers and Sellers:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Stage 1 (Order Lock — 30%):</strong> Upon order confirmation, 30% of the total payment is released to the Seller to cover preparation costs.</li>
            <li><strong>Stage 2 (Shipment — 20%):</strong> Upon confirmation of shipment with valid tracking, an additional 20% is released to the Seller.</li>
            <li><strong>Stage 3 (Delivery — 50%):</strong> Upon the Buyer's confirmation of satisfactory delivery, the remaining 50% is released to the Seller.</li>
          </ul>
          <p><strong>5.2 CELO Transactions.</strong> All transactions on the Platform are denominated in CELO. By transacting on the Platform, you acknowledge the inherent volatility and risks associated with cryptocurrency.</p>
          <p><strong>5.3 Payment Finality.</strong> Blockchain transactions are irreversible. Vendly is not responsible for funds sent to incorrect wallet addresses or losses arising from user error in cryptocurrency transactions.</p>
          <p><strong>5.4 Dispute Resolution.</strong> If a Buyer does not confirm delivery within 14 days of the shipping date, and no dispute has been raised, the funds will be automatically released to the Seller. Disputes must be raised within 7 days of the expected delivery date.</p>
          <p><strong>5.5 Refunds.</strong> Refunds are processed at Vendly's discretion following dispute resolution. Refunds are issued in CELO at the exchange rate prevailing at the time of the original transaction. Vendly does not guarantee any specific fiat currency value.</p>
          <p><strong>5.6 Platform Fees.</strong> Vendly deducts its platform commission before releasing funds to Sellers. Buyers pay no additional platform fees above the listed Product price unless explicitly disclosed.</p>
          <p><strong>5.7 Wallet Security.</strong> Users are solely responsible for the security of their cryptocurrency wallets. Vendly is not responsible for losses arising from wallet compromises, loss of private keys, or unauthorized access to external wallets.</p>
        </Section>

        <Section num="6" title="Buyer Rights and Responsibilities">
          <p><strong>6.1 Purchase Process.</strong> By placing an order, you make a binding offer to purchase the Product at the listed price. The contract of sale is formed upon Seller acceptance and payment confirmation.</p>
          <p><strong>6.2 Due Diligence.</strong> Buyers are encouraged to thoroughly review Product listings, Seller ratings, and descriptions before purchasing. Vendly does not verify the quality of Products listed on the Platform.</p>
          <p><strong>6.3 Delivery Confirmation.</strong> Buyers must confirm delivery on the Platform within 7 days of receiving the Product. Failure to do so may result in automatic escrow release to the Seller.</p>
          <p><strong>6.4 Returns and Refunds.</strong> Return and refund eligibility depends on the Seller's stated return policy and Vendly's dispute resolution process. Vendly is not obligated to provide refunds except where required by applicable consumer protection law.</p>
          <p><strong>6.5 Buyer Conduct.</strong> Buyers must not:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Submit fraudulent orders or dispute claims in bad faith.</li>
            <li>Abuse the dispute resolution system.</li>
            <li>Attempt to transact with Sellers outside the Platform to avoid fees.</li>
            <li>Leave false, misleading, or malicious reviews.</li>
          </ul>
        </Section>

        <Section num="7" title="User Content and Intellectual Property">
          <p><strong>7.1 Your Content.</strong> You retain ownership of Content you submit to the Platform. By submitting Content, you grant Vendly a worldwide, royalty-free, non-exclusive, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform your Content in connection with operating and promoting the Platform.</p>
          <p><strong>7.2 Content Standards.</strong> All Content you post must:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Be accurate and not misleading.</li>
            <li>Not infringe any third-party intellectual property, privacy, or other rights.</li>
            <li>Not contain malware, viruses, or harmful code.</li>
            <li>Not be defamatory, harassing, discriminatory, or obscene.</li>
            <li>Comply with all applicable laws and regulations.</li>
          </ul>
          <p><strong>7.3 Vendly Intellectual Property.</strong> All Platform content, software, design, trademarks, logos, and other intellectual property owned by Vendly are protected by applicable intellectual property laws. You may not use, reproduce, or distribute Vendly's intellectual property without our express written consent.</p>
          <p><strong>7.4 DMCA Compliance.</strong> Vendly respects intellectual property rights. If you believe your intellectual property has been infringed, please contact us at legal@vendly.com with your DMCA takedown notice.</p>
          <p><strong>7.5 Feedback.</strong> Any feedback, suggestions, or ideas you provide to Vendly may be used by us without restriction or compensation to you.</p>
        </Section>

        <Section num="8" title="Prohibited Conduct">
          <p>You agree not to engage in any of the following prohibited activities:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Using the Platform for any unlawful purpose or in violation of any applicable law.</li>
            <li>Attempting to gain unauthorized access to any part of the Platform, other Accounts, or Vendly's systems.</li>
            <li>Circumventing, disabling, or interfering with security features of the Platform.</li>
            <li>Scraping, data mining, or extracting data from the Platform without authorization.</li>
            <li>Using automated bots, scripts, or other automated means to access or use the Platform.</li>
            <li>Transmitting spam, unsolicited messages, or promotional material to other Users.</li>
            <li>Impersonating any person, entity, or organization.</li>
            <li>Engaging in market manipulation, price fixing, or anti-competitive behavior.</li>
            <li>Attempting to introduce malware, viruses, or other destructive code.</li>
            <li>Engaging in money laundering, terrorist financing, or other financial crimes.</li>
            <li>Creating fake reviews, manipulating ratings, or artificially inflating your reputation.</li>
            <li>Conducting transactions outside the Platform to avoid fees or obligations.</li>
            <li>Threatening, harassing, or abusing other Users or Vendly staff.</li>
            <li>Reverse engineering, decompiling, or disassembling the Platform.</li>
          </ul>
        </Section>

        <Section num="9" title="Privacy and Data Protection">
          <p><strong>9.1 Privacy Policy.</strong> Your use of the Platform is subject to our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to our collection, use, and sharing of your information as described in our Privacy Policy.</p>
          <p><strong>9.2 Data Accuracy.</strong> You are responsible for ensuring that any personal information you provide to us is accurate and up to date.</p>
          <p><strong>9.3 Cookies.</strong> The Platform uses cookies and similar tracking technologies. By using the Platform, you consent to our use of cookies as described in our Cookie Policy.</p>
          <p><strong>9.4 Communications.</strong> By registering an Account, you consent to receive transactional emails relating to your Account and orders. You may opt out of marketing communications at any time by updating your notification preferences in your Account settings.</p>
          <p><strong>9.5 Data Retention.</strong> We retain your personal data for as long as necessary to provide our services and comply with legal obligations. Upon Account deletion, we may retain certain data as required by law or for legitimate business purposes.</p>
          <p><strong>9.6 Security.</strong> We implement industry-standard security measures to protect your data. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
        </Section>

        <Section num="10" title="Disclaimer of Warranties">
          <p>TO THE FULLEST EXTENT PERMITTED BY LAW, THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</li>
            <li>WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY CONTENT ON THE PLATFORM.</li>
            <li>WARRANTIES THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, VIRUS-FREE, OR SECURE.</li>
            <li>WARRANTIES REGARDING THE QUALITY, SAFETY, OR LEGALITY OF PRODUCTS LISTED ON THE PLATFORM.</li>
            <li>WARRANTIES REGARDING THE CONDUCT OR REPRESENTATIONS OF ANY USER.</li>
          </ul>
          <p className="mt-3">VENDLY DOES NOT ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT LISTED OR SOLD ON THE PLATFORM BY SELLERS.</p>
        </Section>

        <Section num="11" title="Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL VENDLY, ITS AFFILIATES, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</li>
            <li>LOSS OF PROFITS, REVENUE, DATA, BUSINESS, OR GOODWILL.</li>
            <li>DAMAGES ARISING FROM YOUR USE OR INABILITY TO USE THE PLATFORM.</li>
            <li>DAMAGES ARISING FROM UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR TRANSMISSIONS OR DATA.</li>
            <li>ANY CONDUCT OR CONTENT OF THIRD PARTIES ON THE PLATFORM.</li>
            <li>LOSSES ARISING FROM CRYPTOCURRENCY PRICE VOLATILITY OR BLOCKCHAIN TRANSACTION FAILURES.</li>
          </ul>
          <p className="mt-3">IN ANY CASE, VENDLY'S AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL FEES PAID BY YOU TO VENDLY IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) USD $100.</p>
          <p>SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR LIMITATION OF LIABILITY. IN SUCH CASES, THESE LIMITATIONS APPLY TO THE EXTENT PERMITTED BY LAW.</p>
        </Section>

        <Section num="12" title="Indemnification">
          <p>You agree to indemnify, defend, and hold harmless Vendly and its affiliates, directors, officers, employees, agents, and licensors from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Your access to or use of the Platform.</li>
            <li>Your violation of these Terms.</li>
            <li>Your violation of any third-party right, including intellectual property, privacy, or contractual rights.</li>
            <li>Any Content you submit to the Platform.</li>
            <li>Any Products you list, sell, or offer on the Platform.</li>
            <li>Any dispute between you and another User.</li>
          </ul>
          <p>We reserve the right to assume exclusive control of any matter subject to indemnification by you, at your expense. You agree to cooperate with our defense of such claims.</p>
        </Section>

        <Section num="13" title="Dispute Resolution">
          <p><strong>13.1 Platform Disputes.</strong> Disputes between Buyers and Sellers shall first be submitted to Vendly's internal dispute resolution process. Vendly's decision in such disputes is final and binding, subject to applicable law.</p>
          <p><strong>13.2 Governing Law.</strong> These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Vendly Technologies Ltd. is incorporated, without regard to its conflict of law provisions.</p>
          <p><strong>13.3 Arbitration.</strong> Subject to applicable law, any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or validity thereof, shall be resolved by binding arbitration in accordance with the rules of a recognized arbitration institution. The arbitration shall be conducted in English.</p>
          <p><strong>13.4 Class Action Waiver.</strong> To the extent permitted by law, you waive any right to participate in a class action lawsuit or class-wide arbitration against Vendly.</p>
          <p><strong>13.5 Equitable Relief.</strong> Notwithstanding the foregoing, Vendly may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent unauthorized use of the Platform or infringement of its intellectual property rights.</p>
        </Section>

        <Section num="14" title="Termination">
          <p><strong>14.1 Termination by You.</strong> You may terminate your Account at any time by contacting us at support@vendly.com. Termination does not affect any rights or obligations that arose prior to termination.</p>
          <p><strong>14.2 Termination by Vendly.</strong> We may suspend or terminate your Account and access to the Platform immediately, without prior notice or liability, for any reason, including if we reasonably believe you have violated these Terms.</p>
          <p><strong>14.3 Effects of Termination.</strong> Upon termination:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Your right to access and use the Platform ceases immediately.</li>
            <li>Any outstanding orders will be processed according to these Terms.</li>
            <li>Escrow funds will be handled according to the stage of the transaction.</li>
            <li>Vendly may retain your data as required by law or legitimate business interests.</li>
          </ul>
          <p><strong>14.4 Survival.</strong> Sections relating to intellectual property, disclaimers, limitations of liability, indemnification, and dispute resolution shall survive termination of these Terms.</p>
        </Section>

        <Section num="15" title="Miscellaneous">
          <p><strong>15.1 Entire Agreement.</strong> These Terms, together with our Privacy Policy and any other policies incorporated by reference, constitute the entire agreement between you and Vendly regarding your use of the Platform and supersede all prior agreements.</p>
          <p><strong>15.2 Severability.</strong> If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.</p>
          <p><strong>15.3 Waiver.</strong> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.</p>
          <p><strong>15.4 Assignment.</strong> You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may freely assign our rights and obligations under these Terms.</p>
          <p><strong>15.5 Force Majeure.</strong> Vendly shall not be liable for any failure or delay in performance arising from causes beyond our reasonable control, including natural disasters, government actions, blockchain network issues, or internet outages.</p>
          <p><strong>15.6 Relationship of Parties.</strong> Nothing in these Terms creates any partnership, joint venture, employment, or agency relationship between you and Vendly.</p>
          <p><strong>15.7 Language.</strong> These Terms are provided in English. Any translation is for convenience only. In the event of a conflict between the English version and any translation, the English version prevails.</p>
          <p><strong>15.8 Contact Information.</strong> For questions about these Terms, contact us at:</p>
          <div className="bg-neutral-100 rounded-xl p-4 mt-2 not-prose">
            <p className="font-bold text-neutral-900">Vendly Technologies Ltd.</p>
            <p>Email: legal@vendly.com</p>
            <p>Support: support@vendly.com</p>
            <p>Website: vendly.com</p>
          </div>
        </Section>

        {/* Back to register CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-neutral-500 mb-4">By creating an account, you agree to these Terms & Conditions.</p>
          <Link href="/login"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors">
            Back to Register
          </Link>
        </div>
      </div>
    </div>
  );
}
