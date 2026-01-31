export const NARRATIVE_ARCHETYPES = [
    {
        name: "The Corporate Whistleblower",
        element: "Embezzled funds, silenced employees, shell companies, shredded documents.",
        focus: "Forensic accounting and email trail analysis."
    },
    {
        name: "The Suburban Secret",
        element: "Missing neighbors, hidden debts, infidelity, neighborhood watch gossip.",
        focus: "Timeline reconstruction and phone location data."
    },
    {
        name: "The Pharmaceutical Cover-up",
        element: "Clinical trial deaths, falsified lab results, bribed doctors, anonymous tips.",
        focus: "Toxicology reports and medical communication."
    },
    {
        name: "The Organized Crime Hit",
        element: "Territory disputes, professional hits, burner phones, money laundering.",
        focus: "Ballistics and organized crime connections."
    },
    {
        name: "The Cold Case Reopening",
        element: "New DNA technology, witness recanting, lost evidence found, political pressure.",
        focus: "Re-interviewing witnesses and modern forensic re-analysis."
    }
];

export const DOCUMENT_TEMPLATE_GUIDE = `
When generating EvidenceItems of type 'PAPER', you MUST assign a 'templateId' in metadata and populate 'metadata.fields' matching these schemas:

1. 'autopsy-report':
   - Fields: caseNumber, decedentName, dateOfDeath, timeOfDeath, examinerName, externalFindings, internalFindings, causeOfDeath, mannerOfDeath, toxicologyNotes
   
2. 'bank-statement':
   - Fields: bankName, accountHolder, accountNumber, statementPeriod, startingBalance, endingBalance, transactions (array of {date, description, amount, type})

3. 'search-warrant':
   - Fields: warrantId, judgeName, targetAddress, targetPerson, itemsToSeize (array), probableCause, dateIssued

4. 'transcript-excerpt':
   - Fields: source, timestampRange, speakers (array of {name, line})

5. 'forensic-report':
   - Fields: caseNumber, reportType, analyst, date, subject, evidenceId, findings, matchProbability, status (MATCH/INCONCLUSIVE)

6. 'email-printout':
   - Fields: from, to, date, subject, body

7. 'news-clipping':
   - Fields: headline, date, publication, body, author

8. 'incident-report' (Police Report):
   - Fields: reportNumber, officer, incidentType, location, datetime, narrative

9. 'witness-statement' (Handwritten form):
   - Fields: name, timestamp, officer, body

NOTE: For 'PHOTO' or 'OBJECT' types, the content description is sufficient, but 'metadata.location' is required.
`;
