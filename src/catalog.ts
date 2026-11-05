import type { CategoryDefinition, EvidenceDefinition } from './types';

/**
 * Static evidence catalog.
 *
 * This is informational content, not legal advice. It follows the structure of
 * 8 CFR 204.5(k) (exceptional ability) and Matter of Dhanasar, 26 I&N Dec. 884
 * (AAO 2016) (the three-prong national interest waiver test).
 */

export const CATEGORIES: CategoryDefinition[] = [
  {
    key: 'procedural',
    title: 'Identity & procedural',
    shortTitle: 'Procedural',
    description:
      'The filing mechanics every self-petitioner needs before USCIS will look at the merits: identity, Form I-140, the fee, translations, and a clear cover letter.',
    legalBasis: 'Form I-140 instructions; 8 CFR 103.2(b); 8 CFR 204.5(k)',
  },
  {
    key: 'exceptional_ability',
    title: 'Exceptional ability (A–G)',
    shortTitle: 'Exceptional ability',
    description:
      'At least three of the seven regulatory criteria must be documented. More than three can be submitted, but three strong criteria beat seven weak ones.',
    legalBasis: '8 CFR 204.5(k)(2)–(3)',
  },
  {
    key: 'dhanasar_1',
    title: 'Dhanasar prong 1 — substantial merit & national importance',
    shortTitle: 'Prong 1',
    description:
      'The proposed endeavor must have both substantial merit and national importance. The focus is on the work itself and its broader impact, not on the applicant’s job title.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 889–93 (AAO 2016)',
  },
  {
    key: 'dhanasar_2',
    title: 'Dhanasar prong 2 — well positioned to advance the endeavor',
    shortTitle: 'Prong 2',
    description:
      'The applicant must show a record of success and a realistic plan to advance the proposed endeavor in the United States.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
  },
  {
    key: 'dhanasar_3',
    title: 'Dhanasar prong 3 — beneficial to waive the job offer and labor certification',
    shortTitle: 'Prong 3',
    description:
      'On balance, the national interest must justify waiving the job offer and labor certification requirements, considering urgency and any harm to U.S. workers.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 891–93 (AAO 2016)',
  },
  {
    key: 'supporting',
    title: 'Supporting materials',
    shortTitle: 'Supporting',
    description:
      'Exhibit indexing, a filing timeline, backup copies, and optional professional review. These make a strong case usable and reviewable.',
    legalBasis: 'Form I-140 instructions; 8 CFR 103.2(b)(4)–(5)',
  },
];

export const EVIDENCE_CATALOG: EvidenceDefinition[] = [
  // ── Identity & procedural ────────────────────────────────────────────────
  {
    slug: 'passport-identity',
    category: 'procedural',
    code: '',
    title: 'Passport and identity documents',
    description:
      'A clear, current identity record that matches the name used on every form, exhibit, and letter.',
    legalBasis: 'Form I-140 identity requirements; 8 CFR 103.2(b)(1)',
    required: true,
    weight: 5,
    criteria: [
      'A current passport biographical page is included.',
      'The name matches Form I-140 and all supporting letters exactly.',
      'Any legal name change is documented (marriage certificate, court order).',
      'Scans are colour, legible, and not cropped.',
    ],
    tips: [
      'Use one spelling of your name across every document. Inconsistencies are a common request-for-evidence trigger.',
      'If your passport expires before filing, include a renewal plan or an alternate government ID.',
    ],
  },
  {
    slug: 'form-i140',
    category: 'procedural',
    code: '',
    title: 'Form I-140, Immigrant Petition for Alien Worker',
    description:
      'The petition itself, completed for the EB-2 classification with the National Interest Waiver request.',
    legalBasis: '8 CFR 204.5(k); Form I-140 instructions',
    required: true,
    weight: 5,
    criteria: [
      'The current USCIS edition of Form I-140 is used.',
      'Every section is complete, including the classification and NIW request.',
      'The petition is signed and dated by the self-petitioner.',
      'The correct filing fee is included or a fee waiver is documented.',
    ],
    tips: [
      'Download the form from USCIS on the day you file; editions change and stale forms are rejected.',
      'Keep a complete photocopy of the signed petition and every exhibit before mailing.',
    ],
  },
  {
    slug: 'filing-fee',
    category: 'procedural',
    code: '',
    title: 'Filing fee and payment record',
    description:
      'Proof that the correct fee was paid in an accepted form, or that a fee waiver was granted.',
    legalBasis: '8 CFR 103.7; Form I-140 instructions',
    required: true,
    weight: 3,
    criteria: [
      'The current I-140 fee amount is confirmed on the USCIS fee schedule.',
      'Payment is by an accepted method (check, money order, or authorized card form).',
      'The check or money order is payable to the correct payee and signed.',
      'A copy of the payment instrument is retained for the file.',
    ],
    tips: [
      'Check the USCIS fee schedule immediately before filing; fees change.',
      'Do not staple the payment to the form in a way that damages it.',
    ],
  },
  {
    slug: 'labor-cert-waiver-request',
    category: 'procedural',
    code: '',
    title: 'Request to waive the job offer and labor certification',
    description:
      'An explicit written request that USCIS waive the usual job-offer and labor-certification requirements under the national interest waiver standard.',
    legalBasis: '8 CFR 204.5(k)(4)(ii); Matter of Dhanasar',
    required: true,
    weight: 5,
    criteria: [
      'The request is stated in the cover letter or a separate signed statement.',
      'It cites the national interest waiver provision and Dhanasar.',
      'It explains that the waiver is requested for a self-petition.',
      'It points to the sections of the brief that support each Dhanasar prong.',
    ],
    tips: [
      'Make the request explicit. USCIS should not have to infer that you are asking for a waiver.',
      'Sign and date the statement, and use the same signature block as the petition.',
    ],
  },
  {
    slug: 'certified-translations',
    category: 'procedural',
    code: '',
    title: 'Certified translations of foreign-language documents',
    description:
      'Complete English translations with a signed translator certification for every non-English document.',
    legalBasis: '8 CFR 103.2(b)(3)',
    required: true,
    weight: 4,
    criteria: [
      'Every non-English document in the exhibit list is identified.',
      'Each translation is complete, including stamps, seals, and marginal notes.',
      'A translator certification states competence and translation accuracy.',
      'The original document and the translation are filed together.',
    ],
    tips: [
      'Machine translation alone is not a certified translation. Use a qualified human translator.',
      'Keep the translator’s contact details in the file in case USCIS asks for clarification.',
    ],
  },
  {
    slug: 'credential-evaluation',
    category: 'procedural',
    code: '',
    title: 'Foreign credential evaluation',
    description:
      'An independent evaluation equating your foreign education to a U.S. degree, where education is part of the exceptional-ability record.',
    legalBasis: '8 CFR 204.5(k)(2); 8 CFR 204.5(k)(3)(i)(A)',
    required: true,
    weight: 4,
    criteria: [
      'The evaluation is from a recognized credential-evaluation service.',
      'It states the U.S. equivalency (for example, a master’s degree).',
      'It is based on official transcripts, not photocopies alone.',
      'The evaluator’s signature and letterhead are present.',
    ],
    tips: [
      'Ask for a course-by-course or detailed evaluation if your degree title does not map cleanly to a U.S. degree.',
      'Order a sealed original for USCIS and keep a scan for your own records.',
    ],
  },
  {
    slug: 'cover-letter-toc',
    category: 'procedural',
    code: '',
    title: 'Cover letter and table of contents',
    description:
      'A roadmap that tells the officer what the case shows, where each prong is addressed, and where every exhibit lives.',
    legalBasis: 'Form I-140 instructions; 8 CFR 103.2(b)(4)',
    required: true,
    weight: 3,
    criteria: [
      'The cover letter summarises the case in one to two pages.',
      'It maps each Dhanasar prong and each claimed criterion to specific exhibits.',
      'The table of contents lists every exhibit with tab numbers.',
      'Page numbers and exhibit numbers are consistent throughout.',
    ],
    tips: [
      'Write the cover letter last, after the exhibit list is final.',
      'Use the same labels in the letter, tabs, and index so the officer can navigate quickly.',
    ],
  },

  // ── Exceptional ability (A–G) ────────────────────────────────────────────
  {
    slug: 'ea-a-degree',
    category: 'exceptional_ability',
    code: 'A',
    title: 'Criterion A — Degree or similar award',
    description:
      'A degree, diploma, certificate, or similar award from a college, university, school, or other institution of learning relating to your area of exceptional ability.',
    legalBasis: '8 CFR 204.5(k)(3)(i)(A)',
    required: false,
    weight: 4,
    criteria: [
      'The diploma or certificate is included as an exhibit.',
      'Official transcripts corroborate the degree.',
      'The institution and program are identifiable and accredited.',
      'The degree relates directly to the claimed area of exceptional ability.',
    ],
    tips: [
      'A degree alone rarely proves exceptional ability; pair it with recognition or impact evidence.',
      'If the institution is unfamiliar to U.S. officers, include a short profile and accreditation information.',
    ],
  },
  {
    slug: 'ea-b-ten-years',
    category: 'exceptional_ability',
    code: 'B',
    title: 'Criterion B — At least ten years of full-time experience',
    description:
      'Letters from current or former employers documenting at least ten years of full-time experience in the occupation.',
    legalBasis: '8 CFR 204.5(k)(3)(i)(B)',
    required: false,
    weight: 4,
    criteria: [
      'Letters are on employer letterhead and signed by an authorised person.',
      'Each letter states start and end dates and full-time status.',
      'Duties and the applicant’s role are described in detail.',
      'The letters together document at least ten years in the occupation.',
    ],
    tips: [
      'Ask each employer to state dates, title, and full-time hours explicitly rather than only describing duties.',
      'Fill gaps with contracts, tax records, or client letters, and explain any career breaks.',
    ],
  },
  {
    slug: 'ea-c-license',
    category: 'exceptional_ability',
    code: 'C',
    title: 'Criterion C — License or professional certification',
    description:
      'A license to practice the profession, or a certification for a particular profession or occupation.',
    legalBasis: '8 CFR 204.5(k)(3)(i)(C)',
    required: false,
    weight: 4,
    criteria: [
      'A current license or certification is included.',
      'The issuing authority and credential number are visible.',
      'The credential is valid on the filing date.',
      'Any foreign-language credential is accompanied by a certified translation.',
    ],
    tips: [
      'Include the licensing body’s requirements so the officer can see the credential is selective.',
      'If the license is state-specific, explain how it relates to the national endeavor.',
    ],
  },
  {
    slug: 'ea-d-salary',
    category: 'exceptional_ability',
    code: 'D',
    title: 'Criterion D — Salary or remuneration demonstrating exceptional ability',
    description:
      'Evidence that you have commanded a salary or other remuneration for services that demonstrates exceptional ability.',
    legalBasis: '8 CFR 204.5(k)(3)(i)(D)',
    required: false,
    weight: 4,
    criteria: [
      'Pay stubs, W-2s, or tax returns show actual compensation.',
      'An employer letter confirms salary, bonus, and equity components.',
      'A market comparison (survey or official data) benchmarks the compensation.',
      'The comparison explains why the figure is exceptional for the field and location.',
    ],
    tips: [
      'A high salary without context is weak. Pair the number with a credible market benchmark.',
      'Redact sensitive identifiers consistently, and explain any redactions in a note.',
    ],
  },
  {
    slug: 'ea-e-membership',
    category: 'exceptional_ability',
    code: 'E',
    title: 'Criterion E — Membership in professional associations',
    description:
      'Membership in associations in the field that require outstanding achievements of their members, as judged by recognised experts.',
    legalBasis: '8 CFR 204.5(k)(3)(i)(E)',
    required: false,
    weight: 4,
    criteria: [
      'Proof of current membership is included.',
      'The association’s admission criteria show a selective standard.',
      'The association is recognised in the field.',
      'The membership relates to the claimed area of exceptional ability.',
    ],
    tips: [
      'Open-membership associations carry little weight. Show selective admission criteria.',
      'Include the association’s own description of its membership standards, not just your card.',
    ],
  },
  {
    slug: 'ea-f-recognition',
    category: 'exceptional_ability',
    code: 'F',
    title: 'Criterion F — Recognition for achievements and significant contributions',
    description:
      'Recognition for achievements and significant contributions to the industry or field by peers, government entities, or professional or business organisations.',
    legalBasis: '8 CFR 204.5(k)(3)(i)(F)',
    required: false,
    weight: 4,
    criteria: [
      'Awards, honours, or formal recognition are documented.',
      'The awarding body and selection criteria are explained.',
      'Peer or institutional letters describe the significance of the contribution.',
      'Independent evidence corroborates the claimed impact.',
    ],
    tips: [
      'Explain the significance of each award: who grants it, how many people receive it, and why it matters.',
      'Independent corroboration is stronger than self-description.',
    ],
  },
  {
    slug: 'ea-g-other',
    category: 'exceptional_ability',
    code: 'G',
    title: 'Criterion G — Other comparable evidence',
    description:
      'Other comparable evidence of exceptional ability that does not fit neatly into criteria A–F.',
    legalBasis: '8 CFR 204.5(k)(3)(i)(G)',
    required: false,
    weight: 4,
    criteria: [
      'At least one strong piece of comparable evidence is included.',
      'The submission explains why the evidence is comparable to A–F.',
      'The evidence is independently verifiable.',
      'It is not merely a restatement of weaker evidence already submitted.',
    ],
    tips: [
      'Use this criterion deliberately, not as a catch-all. Explain the comparability in one clear paragraph.',
      'Strong candidates include competitive grants, patents with commercial impact, or rare technical credentials.',
    ],
  },

  // ── Dhanasar prong 1 ─────────────────────────────────────────────────────
  {
    slug: 'endeavor-statement',
    category: 'dhanasar_1',
    code: '',
    title: 'Proposed endeavor statement',
    description:
      'A specific, detailed description of the work you propose to do in the United States, including the field, the activities, and the intended impact.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 889–90 (AAO 2016)',
    required: true,
    weight: 5,
    criteria: [
      'The endeavor is described specifically, not as a generic occupation.',
      'The statement explains what you will do, where, and for whom.',
      'It identifies the field and the intended beneficiaries.',
      'It connects the work to a broader national interest.',
      'It avoids vague phrases such as “work in the tech industry”.',
    ],
    tips: [
      'Describe a concrete endeavor, not “I will work as an engineer”. Explain the problem you will solve.',
      'Keep the statement consistent with your CV, letters, and business plan.',
    ],
  },
  {
    slug: 'national-importance',
    category: 'dhanasar_1',
    code: '',
    title: 'Evidence of national importance',
    description:
      'Evidence that the proposed endeavor has national importance, meaning a potential prospective impact that is broader than a single employer or locality.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 889–90 (AAO 2016)',
    required: true,
    weight: 5,
    criteria: [
      'The impact is described as broader than one employer or one city.',
      'The filing cites credible sources, policy priorities, or agency needs.',
      'The geographic or sectoral reach is explained.',
      'The claimed impact is prospective and plausible, not merely historical.',
    ],
    tips: [
      'Tie the work to a documented national priority (for example, public health, energy, infrastructure, or advanced computing).',
      'Avoid claiming national importance only because the employer is large.',
    ],
  },
  {
    slug: 'substantial-merit',
    category: 'dhanasar_1',
    code: '',
    title: 'Evidence of substantial merit',
    description:
      'Evidence that the endeavor has substantial merit in the sciences, arts, or business, including its potential economic, cultural, educational, or welfare impact.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890 (AAO 2016)',
    required: true,
    weight: 4,
    criteria: [
      'The intrinsic value of the work is explained.',
      'Potential economic, cultural, educational, or welfare impact is described.',
      'Claims are supported by credible sources or expert letters.',
      'The merit is tied to the specific endeavor, not only to the field in general.',
    ],
    tips: [
      'Use concrete outcomes and credible sources rather than adjectives.',
      'Explain the mechanism: how does the work produce the claimed benefit?',
    ],
  },
  {
    slug: 'expert-letters-national-importance',
    category: 'dhanasar_1',
    code: '',
    title: 'Expert letters on national importance',
    description:
      'Letters from independent experts explaining why the proposed endeavor is nationally important.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016)',
    required: false,
    weight: 4,
    criteria: [
      'At least two independent experts contribute letters.',
      'Each letter explains national importance in specific terms.',
      'The experts’ credentials and independence are documented.',
      'Letters are signed, dated, and on letterhead.',
    ],
    tips: [
      'Ask experts to address national importance directly rather than only praising your skills.',
      'Drafting guidance is fine, but the expert must own the final wording.',
    ],
  },
  {
    slug: 'us-impact',
    category: 'dhanasar_1',
    code: '',
    title: 'U.S. impact and beneficiaries',
    description:
      'Evidence describing who in the United States benefits from the endeavor and how the impact can be measured.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890 (AAO 2016)',
    required: false,
    weight: 4,
    criteria: [
      'The U.S. beneficiaries are identified.',
      'The geographic reach within the United States is described.',
      'Outcome metrics or milestones are proposed.',
      'Supporting letters or data corroborate the impact.',
    ],
    tips: [
      'Name the institutions, communities, or industries that benefit.',
      'Quantify where possible, but keep the numbers defensible.',
    ],
  },

  // ── Dhanasar prong 2 ─────────────────────────────────────────────────────
  {
    slug: 'cv-resume',
    category: 'dhanasar_2',
    code: '',
    title: 'Curriculum vitae',
    description:
      'A complete academic and professional CV that supports the claim that you are well positioned to advance the endeavor.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
    required: true,
    weight: 5,
    criteria: [
      'Education, employment, and awards are listed chronologically.',
      'Publications and presentations are complete and consistent with exhibits.',
      'Roles and responsibilities are described clearly.',
      'The CV is consistent with the petition and recommendation letters.',
    ],
    tips: [
      'Every claim in the CV should be supported by an exhibit or a letter.',
      'Use a clean, readable format; the officer may read it alongside the brief.',
    ],
  },
  {
    slug: 'publications',
    category: 'dhanasar_2',
    code: '',
    title: 'Publications and scholarly work',
    description:
      'Peer-reviewed or professionally published work that demonstrates a record of achievement in the field.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
    required: false,
    weight: 4,
    criteria: [
      'Full citations and copies of publications are included.',
      'Authorship position and contribution are stated.',
      'Venue quality or peer-review status is explained.',
      'The work connects to the proposed endeavor.',
    ],
    tips: [
      'Quality beats quantity. Highlight the most significant papers rather than every abstract.',
      'Include the journal’s acceptance rate or ranking if it supports the quality claim.',
    ],
  },
  {
    slug: 'citations',
    category: 'dhanasar_2',
    code: '',
    title: 'Citations and research impact',
    description:
      'Citation data showing that others in the field have relied on your work.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
    required: false,
    weight: 4,
    criteria: [
      'A citation report from a recognised database is included.',
      'Independent citations are distinguished from self-citations.',
      'Field-normalised metrics or percentiles are explained.',
      'Specific citing works are highlighted where they show impact.',
    ],
    tips: [
      'Explain what the numbers mean in your field; raw counts vary widely by discipline.',
      'Point to specific citing papers that used your results, not just the total count.',
    ],
  },
  {
    slug: 'patents-ip',
    category: 'dhanasar_2',
    code: '',
    title: 'Patents and intellectual property',
    description:
      'Granted patents, pending applications, licenses, or other intellectual property that show applied impact.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
    required: false,
    weight: 3,
    criteria: [
      'Patent numbers, jurisdictions, and status are listed.',
      'The applicant’s contribution to the invention is explained.',
      'Commercial use or licensing is documented where available.',
      'The IP connects to the proposed endeavor.',
    ],
    tips: [
      'A granted patent is stronger than a pending application, but pending applications can still support the record.',
      'Explain the problem the invention solves in plain language.',
    ],
  },
  {
    slug: 'speaking-engagements',
    category: 'dhanasar_2',
    code: '',
    title: 'Invited talks and speaking engagements',
    description:
      'Invited lectures, conference talks, panels, or keynote appearances that show recognition and positioning.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
    required: false,
    weight: 3,
    criteria: [
      'The event, date, and venue are documented.',
      'The invitation or programme listing is included.',
      'The audience and selection process are described.',
      'Recordings or slides are available where relevant.',
    ],
    tips: [
      'Distinguish invited talks from submitted conference presentations.',
      'Include the conference programme showing your name and session.',
    ],
  },
  {
    slug: 'awards-recognition',
    category: 'dhanasar_2',
    code: '',
    title: 'Awards and professional recognition',
    description:
      'Prizes, fellowships, honours, or competitive selections that demonstrate a record of excellence.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
    required: false,
    weight: 4,
    criteria: [
      'The award and awarding organisation are documented.',
      'Selection criteria and competitiveness are explained.',
      'The award is relevant to the proposed endeavor.',
      'Independent evidence corroborates the recognition.',
    ],
    tips: [
      'Explain how selective the award is; a competitive fellowship is stronger than a participation certificate.',
      'Include the award letter, not only a photo of the trophy.',
    ],
  },
  {
    slug: 'recommendation-letters',
    category: 'dhanasar_2',
    code: '',
    title: 'Recommendation letters',
    description:
      'Letters from independent experts who can speak to your record, your positioning, and the importance of the work.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
    required: true,
    weight: 5,
    criteria: [
      'At least three letters are included.',
      'Most letter writers are independent of your current employer.',
      'Letters give specific examples of your contributions.',
      'Letters explain why you are well positioned to advance the endeavor.',
      'Each letter is signed, dated, and on letterhead.',
    ],
    tips: [
      'Avoid letters that only repeat your CV. Ask for concrete comparisons and examples.',
      'Independence matters; a letter from a close collaborator carries less weight than one from a respected outsider.',
    ],
  },
  {
    slug: 'funding-grants',
    category: 'dhanasar_2',
    code: '',
    title: 'Grants and funding',
    description:
      'Competitive grants, fellowships, or investment that show others have bet on your work.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
    required: false,
    weight: 3,
    criteria: [
      'Grant or funding awards are documented.',
      'The applicant’s role and amount are stated.',
      'The competitiveness of the funding is explained.',
      'The funded work connects to the proposed endeavor.',
    ],
    tips: [
      'Include the award letter and the funding organisation’s selection criteria.',
      'Distinguish grants you won from grants you merely worked under.',
    ],
  },
  {
    slug: 'media-coverage',
    category: 'dhanasar_2',
    code: '',
    title: 'Media coverage and public recognition',
    description:
      'Articles, interviews, or features in reputable outlets that discuss your work.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
    required: false,
    weight: 3,
    criteria: [
      'The outlet and publication date are documented.',
      'The coverage discusses your work, not only your name.',
      'Circulation or audience reach is described.',
      'Foreign-language coverage includes a certified translation.',
    ],
    tips: [
      'Trade press and reputable industry outlets can be stronger than general-interest mentions.',
      'Include the full article, not only a quote or screenshot.',
    ],
  },
  {
    slug: 'leadership-critical-role',
    category: 'dhanasar_2',
    code: '',
    title: 'Leadership or critical role',
    description:
      'Evidence that you hold or held a leadership or critical role in a distinguished organisation.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
    required: false,
    weight: 4,
    criteria: [
      'The role and scope of responsibility are documented.',
      'An organisation chart or reporting line is included.',
      'Impact metrics attributable to the role are shown.',
      'An employer or board letter confirms the role.',
    ],
    tips: [
      'Describe the size and importance of the team, budget, or system you led.',
      'Tie the role to measurable outcomes rather than only a job title.',
    ],
  },
  {
    slug: 'us-collaborations',
    category: 'dhanasar_2',
    code: '',
    title: 'U.S. collaborations and partnerships',
    description:
      'Ongoing or planned collaborations with U.S. institutions that show you can advance the endeavor here.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 890–91 (AAO 2016)',
    required: false,
    weight: 3,
    criteria: [
      'U.S. partners or institutions are identified.',
      'The nature of the collaboration is described.',
      'Letters or agreements confirm the relationship.',
      'Future plans in the United States are concrete.',
    ],
    tips: [
      'A signed collaboration letter is stronger than an email expressing interest.',
      'Explain how the collaboration advances the specific proposed endeavor.',
    ],
  },

  // ── Dhanasar prong 3 ─────────────────────────────────────────────────────
  {
    slug: 'waiver-statement',
    category: 'dhanasar_3',
    code: '',
    title: 'Statement on why the waiver benefits the United States',
    description:
      'A focused argument that, on balance, waiving the job offer and labor certification requirements benefits the United States.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 891–93 (AAO 2016)',
    required: true,
    weight: 5,
    criteria: [
      'The statement addresses both the job offer and labor certification requirements.',
      'It explains why the national interest is urgent enough to justify the waiver.',
      'It addresses potential harm to U.S. workers.',
      'It connects the waiver to the prong 1 and prong 2 evidence.',
    ],
    tips: [
      'Do not treat prong 3 as a formality. Explain the counterfactual: what is lost if the waiver is denied?',
      'Address labor-market impact honestly and specifically.',
    ],
  },
  {
    slug: 'urgency-timeliness',
    category: 'dhanasar_3',
    code: '',
    title: 'Urgency and timeliness',
    description:
      'Evidence that the opportunity or need is time-sensitive and that delay would harm the national interest.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 891–93 (AAO 2016)',
    required: false,
    weight: 4,
    criteria: [
      'A time-sensitive opportunity or need is identified.',
      'The timeline is supported by dated evidence.',
      'The consequences of delay are explained.',
      'The urgency is tied to the national interest, not only to personal convenience.',
    ],
    tips: [
      'Use dated letters, contracts, or programme schedules to make the urgency concrete.',
      'Avoid claiming urgency that applies equally to every applicant in the field.',
    ],
  },
  {
    slug: 'labor-market-harm',
    category: 'dhanasar_3',
    code: '',
    title: 'Labor-market impact',
    description:
      'Evidence that granting the waiver will not harm U.S. workers and may create or support opportunities.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 891–93 (AAO 2016)',
    required: false,
    weight: 4,
    criteria: [
      'The statement addresses harm to U.S. workers directly.',
      'Job creation or complementary skills are documented.',
      'The applicant’s economic contribution is explained.',
      'Claims are supported by data or employer letters.',
    ],
    tips: [
      'Complementary skills and job creation are stronger arguments than “no American can do this”.',
      'Use credible labour-market data where possible.',
    ],
  },
  {
    slug: 'us-support-letters',
    category: 'dhanasar_3',
    code: '',
    title: 'U.S. support letters',
    description:
      'Letters from U.S. industry, government, or community organisations explaining why the waiver serves the national interest.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 891–93 (AAO 2016)',
    required: false,
    weight: 4,
    criteria: [
      'Letters come from credible U.S. organisations.',
      'Each letter explains the specific national interest served.',
      'Commitments or plans are concrete.',
      'Contact details for verification are included.',
    ],
    tips: [
      'A letter from an organisation that would actually use or benefit from your work is strongest.',
      'Ask the writer to explain the national interest in their own words.',
    ],
  },
  {
    slug: 'self-employment-context',
    category: 'dhanasar_3',
    code: '',
    title: 'Self-employment or business plan context',
    description:
      'For self-petitioners who will work independently, a plan showing a realistic U.S. venture and its national interest.',
    legalBasis: 'Matter of Dhanasar, 26 I&N Dec. 884, 891–93 (AAO 2016)',
    required: false,
    weight: 3,
    criteria: [
      'A business or employment plan is included.',
      'The U.S. location and market are described.',
      'Funding or revenue assumptions are realistic.',
      'The applicant’s role and milestones are clear.',
    ],
    tips: [
      'Keep financial projections conservative and explain the assumptions.',
      'Tie the plan to the proposed endeavor and the national interest claim.',
    ],
  },

  // ── Supporting materials ─────────────────────────────────────────────────
  {
    slug: 'exhibit-index',
    category: 'supporting',
    code: '',
    title: 'Exhibit index and tabs',
    description:
      'A numbered, tabbed index that lets the officer find every cited document quickly.',
    legalBasis: 'Form I-140 instructions; 8 CFR 103.2(b)(4)',
    required: true,
    weight: 4,
    criteria: [
      'Every exhibit has a unique number or tab.',
      'The index matches the citations in the brief and cover letter.',
      'Tabs are physically present in the mailed package.',
      'Page numbers are continuous across the package.',
    ],
    tips: [
      'Build the index in a spreadsheet and update it as documents change.',
      'Do a final cross-check that every citation in the brief resolves to an exhibit.',
    ],
  },
  {
    slug: 'case-timeline',
    category: 'supporting',
    code: '',
    title: 'Case timeline and filing plan',
    description:
      'A practical plan for completing evidence, reviewing the package, and filing before any deadline.',
    legalBasis: 'Internal case management',
    required: false,
    weight: 3,
    criteria: [
      'Key milestones and owners are listed.',
      'The target filing date leaves a buffer for corrections.',
      'Dependencies (translations, letters, evaluations) are identified.',
      'The plan is reviewed and updated.',
    ],
    tips: [
      'Work backwards from the filing date and add at least two weeks of buffer.',
      'Track letters and translations first; they usually take the longest.',
    ],
  },
  {
    slug: 'legal-review',
    category: 'supporting',
    code: '',
    title: 'Optional professional review',
    description:
      'A review by an immigration attorney or qualified representative, if you choose to use one.',
    legalBasis: 'Optional; not required for a self-petition',
    required: false,
    weight: 2,
    criteria: [
      'A reviewer with immigration experience has reviewed the package.',
      'Substantive feedback is documented and addressed.',
      'The final package has been proofread for consistency.',
      'Any ethical or eligibility concerns are resolved.',
    ],
    tips: [
      'A review is optional, but a second set of eyes catches inconsistencies.',
      'If you self-file, do a structured read-through against this checklist.',
    ],
  },
  {
    slug: 'backup-documentation',
    category: 'supporting',
    code: '',
    title: 'Backup and retention',
    description:
      'A secure local backup of every uploaded document and a plan for retaining originals.',
    legalBasis: 'Internal case management',
    required: false,
    weight: 2,
    criteria: [
      'All uploads are backed up outside this app.',
      'The backup is encrypted or stored on a trusted device.',
      'Original documents are retained in a safe place.',
      'A retention plan covers the period after filing.',
    ],
    tips: [
      'Keep an encrypted copy of the complete package before mailing.',
      'Retain originals and proof of mailing for your records.',
    ],
  },
];

const BY_SLUG = new Map(EVIDENCE_CATALOG.map((item) => [item.slug, item]));

export function getDefinition(slug: string): EvidenceDefinition | undefined {
  return BY_SLUG.get(slug);
}

export function definitionsForCategory(category: CategoryDefinition['key']): EvidenceDefinition[] {
  return EVIDENCE_CATALOG.filter((item) => item.category === category);
}

export const EXCEPTIONAL_ABILITY_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
