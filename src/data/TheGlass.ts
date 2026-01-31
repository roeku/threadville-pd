import { CaseFile, EvidenceType } from "@/types";

export const THE_GLASS: CaseFile = {
    "title": "The Glass Ledger",
    "caseId": "CASE-1769656695463",
    "status": "draft",
    "briefing": "The mood was electric at the Vane family's cliffside estate in Malibu. The evening was intended to celebrate the successful merger between Vane Capital and Thorne Logistics, a deal valued in the billions. Instead, the night ended in tragedy. Shortly after midnight, Marcus Thorne, the charismatic yet ruthless CEO of Thorne Logistics, was found dead in the estate’s private library. He had been struck on the back of the head with a heavy object, and the room showed signs of a brief struggle.\n\nDetectives arrived to find a house full of tension. While the merger made everyone rich on paper, the interpersonal dynamics were toxic. Marcus was known for his aggressive business tactics and his turbulent marriage to Elena Vane, the heiress to the family fortune. The storm raging outside trapped the guests within the sprawling glass-and-concrete mansion, turning the celebration into a pressure cooker of resentment, secrets, and betrayal.",
    "entities": [
        {
            "id": "doc_autopsy",
            "type": EvidenceType.PAPER,
            "clues": [
                "Confirms death caused by blunt force trauma to the occipital bone. Time of death estimated between 22:45 and 23:15, narrowing the suspect window."
            ],
            "label": "Autopsy Report: Marcus Thorne",
            "content": "Official autopsy report filed by the Los Angeles County Medical Examiner regarding the death of Marcus Thorne. The document details the fatal injuries sustained to the back of the head and establishes a precise window for the time of death based on body temperature and rigor mortis.",
            "metadata": {
                "fields": {
                    "caseNumber": "LA-ME-2024-8992",
                    "dateOfDeath": "October 24, 2024",
                    "timeOfDeath": "22:45 - 23:15",
                    "causeOfDeath": "Blunt Force Trauma to the Head (Occipital Bone)",
                    "decedentName": "Marcus Thorne",
                    "examinerName": "Dr. Lydia Sterling, Chief Medical Examiner",
                    "mannerOfDeath": "Homicide",
                    "toxicologyNotes": "Femoral Blood Alcohol Concentration: 0.09 g/dL (Consistent with consumption of approximately 2-3 standard drinks).\n\nComprehensive Drug Screen (Opiates, Amphetamines, Cocaine, Benzodiazepines): Negative.",
                    "externalFindings": "The subject is a well-developed, well-nourished male, appearing stated age of 45 years. \n\nHEAD/NECK: A deep, irregular laceration measuring approximately 6.5cm in length is located on the posterior scalp, centered over the occipital bone. Margins are abraded with tissue bridging intact, consistent with impact by a heavy, blunt object with a somewhat angled edge. There is significant hematoma formation in the surrounding scalp tissue.\n\nUPPER EXTREMITIES: Fresh bruising (ecchymosis) noted across the dorsal aspect of the right metacarpophalangeal joints (knuckles). A linear abrasion (3cm) is present on the left distal forearm, consistent with a defensive posture.",
                    "internalFindings": "SKULL/BRAIN: Reflection of the scalp reveals a depressed comminuted fracture of the occipital bone with radiating fracture lines extending toward the right temporal bone. Removal of the calvarium reveals a large acute subdural hematoma compressing the cerebellum and brainstem. Cerebral contusions are noted at the site of impact (coup) and in the frontal lobes (contrecoup).\n\nCHEST/ABDOMEN: Unremarkable. No evidence of underlying natural disease that would contribute to immediate death."
                },
                "location": "Los Angeles County Morgue",
                "templateId": "autopsy-report"
            },
            "position": [
                0.18038650470130035,
                0.9,
                -0.15187155625479953
            ],
            "rotation": [
                0,
                -0.0762488801461902,
                0
            ],
            "description": "Official medical examiner's report detailing the condition of the body and cause of death."
        },
        {
            "id": "doc_server_logs",
            "type": EvidenceType.PAPER,
            "clues": [
                "At 23:50:03, an entry reads: 'SYS_ADMIN_OVERRIDE: Cameras Disabled [User: E_VANE_02]'. This proves Elena Vane deliberately shut down security before the murder window, contradicting the storm theory."
            ],
            "label": "Home Security System Logs",
            "content": "A 50-page digital forensics report detailing every event logged by the Vane Estate's central security server on the night of the murder, including thousands of mundane entries mixed with one critical manual override command.",
            "metadata": {
                "templateId": "server-log",
                "fields": {
                    "source": "Vane-SmartHome-Core (Ver 4.2)",
                    "timestampRange": "October 24, 2023 23:00 - October 25, 2023 01:00",
                    "entries": [
                        "23:00:05 [SYSTEM]: External perimeter sensors (North/West Cliffs) triggered. Analyzing... Result: False Positive (Wind Velocity > 60mph).",
                        "23:15:22 [POWER]: Mains power fluctuation detected. Switching to UPS Backup for Security Node 4.",
                        "23:28:10 [NETWORK]: Connectivity intermittent on Guest Wi-Fi AP-2. Packet loss detected.",
                        "23:41:15 [ACCESS_GRANT]: Door ID: Library_Main. Method: Biometric (Retina). User: Marcus Thorne (Admin). Status: Entry.",
                        "23:44:00 [COMMAND]: User 'Marcus Thorne' initiated command: 'Privacy Mode'.",
                        "23:44:02 [SYSTEM_RESPONSE]: Interior cameras (Cam-Lib-01, Cam-Lib-02) disabled. Microphone sensitivity reduced to emergency thresholds only. Smart locks engaged on Main Door.",
                        "23:50:03 [SYS_ADMIN_OVERRIDE]: Cameras Disabled [User: E_VANE_02]. Authorization: FULL_SHUTDOWN. All library sensors offline.",
                        "00:03:12 [AUDIO_EVENT]: Decibel spike detected in Sector 4 (Library). Level: 88dB. Duration: 1.4s. Classification: Impact/Crash.",
                        "00:03:15 [AUDIO_EVENT]: Low frequency vibration detected (Floor Sensors).",
                        "00:08:45 [MOTION_DETECT]: Service Corridor B (Connecting Kitchen to Library Rear). Direction: Away from Library.",
                        "00:08:48 [ACCESS_DENIED]: Service Door B. Method: Manual Handle. Forced egress detected."
                    ]
                },
                "location": "Malibu Police Department - Digital Forensics Lab"
            },
            "position": [
                0.3428951655260803,
                0.98,
                -0.04682827277586643
            ],
            "rotation": [
                0,
                1.1185919625381213,
                0
            ],
            "description": "A dense, 50-page printout of every sensor trigger in the mansion (doors, windows, motion) for the last 24 hours. Mostly mundane entries."
        },
        {
            "id": "obj_award",
            "type": EvidenceType.OBJECT,
            "clues": [
                "The murder weapon. The heavy base matches the wound dimensions. The missing chip suggests a fragment might be elsewhere."
            ],
            "label": "Crystal 'Deal of the Year' Award",
            "content": "A heavy, geometric award made of high-quality lead crystal, designed as an abstract, interlocking structure representing two pillars joining together. The front face is laser-etched with the inscription: 'DEAL OF THE YEAR: Vane Capital & Thorne Logistics'. The object is substantial in weight, with a dense, rectangular base. The upper right corner of the crystal spire has sustained damage; a distinct, sharp chip has broken off, leaving a jagged, fractured edge.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "October 24, 2023",
                "notes": "Suspected Murder Weapon. The heavy base dimensions align perfectly with the blunt force trauma wound on the victim's skull. Preliminary visual inspection reveals trace fluids consistent with blood on the lower edge. The missing crystal chip from the upper corner is unaccounted for in the immediate vicinity, suggesting the fragment might be embedded in the wound or carried elsewhere.",
                "author": "N/A",
                "fields": null,
                "location": "Private Library, lying on the persian rug approximately three feet from the victim's body."
            },
            "position": [
                -0.20211879695719023,
                1.06,
                0.09104628635517653
            ],
            "rotation": [
                0,
                0.8720075134438886,
                0
            ],
            "description": "A heavy, geometric award made of lead crystal, celebrating the Thorne-Vane merger. One of the sharp upper corners has chipped off."
        },
        {
            "id": "doc_legal_draft",
            "type": EvidenceType.PAPER,
            "clues": [
                "Reveals Marcus Thorne's plan to file for immediate conservatorship over Elena Vane and liquidate the family trust. Provides the primary motive for Elias to protect the family legacy."
            ],
            "label": "Draft Legal Petition",
            "content": "A crumpled document found on the library floor, drafted on Vane Capital letterhead. It is a legal petition drafted by Marcus Thorne, seeking immediate conservatorship over his wife, Elena Vane, alleging mental incapacity. Crucially, a specific clause outlines the intent to dissolve the Vane Family Trust and liquidate its assets immediately upon the granting of the order.",
            "metadata": {
                "date": "October 24, 2023",
                "notes": "The document is printed on high-quality bond paper but has been violently crumpled, suggesting a moment of rage or discovery during confrontation.",
                "author": "Legal Department (Drafted for Marcus Thorne)",
                "fields": {
                    "headerStr": "VANE CAPITAL\nINTERNAL LEGAL MEMORANDUM // DRAFT",
                    "date": "October 24, 2023",
                    "sender": "Marcus Thorne, Esq.",
                    "recipient": "To: Superior Court of California, County of Los Angeles (Probate Division)",
                    "body": "PETITION FOR APPOINTMENT OF EMERGENCY CONSERVATOR\n\nPETITIONER: Marcus Thorne\nPROPOSED CONSERVATEE: Elena Vane\n\n1. PETITIONER REQUESTS immediate appointment as conservator of the person and estate. The petitioner alleges that the proposed conservatee lacks the capacity to make decisions regarding the Vane Family Trust due to documented mental health instability and substance abuse patterns.\n\n2. LIQUIDATION OF ASSETS: Petitioner seeks express authority to bypass standard probate delays to immediately liquidate the entity known as the 'Vane Family Trust' (est. value $847M). This action is deemed necessary to restructure capital allocation for the Thorne-Vane merger entity and prevent waste of family assets.\n\n3. DECLARATION OF URGENCY: The mental state of the conservatee poses an imminent threat to the financial stability of the estate. Immediate control must be ceded to Mr. Thorne to prevent catastrophic loss. Filing expected October 26, 2023."
                },
                "location": "Library floor, near the desk",
                "templateId": "letterhead-page"
            },
            "position": [
                -0.07351768618585615,
                1.1400000000000001,
                -0.20679036659719474
            ],
            "rotation": [
                0,
                1.4739300042601757,
                0
            ],
            "description": "Documents found crumpled on the library floor near the desk. They are printed on Vane Capital letterhead."
        },
        {
            "id": "obj_shoes_elias",
            "type": EvidenceType.OBJECT,
            "clues": [
                "Examination of the right heel reveals a tiny, embedded fragment of foreign material that doesn't match the outdoor terrain."
            ],
            "label": "Men's Loafers (Size 10)",
            "content": "Exhibit ID: EV-SHOES-01\nDescription: One pair of men's bespoke loafers, Size 10. \nBrand: 'Ferragamo' (Italian).\nMaterial: Dark Walnut Calfskin.\n\nPhysical Condition:\nThe leather upper is thoroughly waterlogged and stained, indicating recent and prolonged exposure to heavy precipitation. The interior soles are damp.\n\nDebris Analysis:\n1. Soles: Heavily caked with mud, wet grass, and saline residue, consistent with the terrain of the estate's cliffside perimeter during the storm.\n2. Right Heel (Forensic Anomaly): A high-magnification scan of the rubber heel stack revealed a minute, embedded fragment. The object is a shard of jagged, iridescent material—possibly glass or crystal—that is distinct from the silica found in the outdoor soil.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "November 14, 2023",
                "notes": "Belonging to Elias Vane. The heavy saturation of the leather contradicts the subject's claim that he remained indoors for the duration of the party. The foreign fragment in the heel requires immediate mass spectrometry.",
                "author": "Crime Scene Unit",
                "fields": null,
                "location": "Vane Estate - Guest Wing Hallway"
            },
            "position": [
                -0.108786777841261,
                1.22,
                0.061157538385189614
            ],
            "rotation": [
                0,
                -0.6730048692454416,
                0
            ],
            "description": "A pair of high-end Italian leather loafers belonging to Elias Vane. They are wet, suggesting recent outdoor use."
        },
        {
            "id": "for_blood_award",
            "type": EvidenceType.FORENSIC_SAMPLE,
            "clues": [
                "Confirms the crystal award was used to strike the victim."
            ],
            "label": "Swab from Crystal Award",
            "content": "Laboratory analysis of the biological sample swabbed from the jagged impact point on the crystal award recovered from the library. Presumptive testing for blood was positive. Confirmatory testing identified the sample as human blood, Type AB+. DNA profiling performed on the extracted material resulted in a complete 16-marker match to the reference profile of the victim, Marcus Thorne. The location and nature of the transfer are consistent with the award being used as a blunt force weapon.",
            "imageUrl": "PENDING",
            "metadata": {
                "forensicType": "BLOOD"
            },
            "position": [
                -0.31323400358209197,
                1.3,
                -0.05578287338448651
            ],
            "rotation": [
                0,
                0.5201930232314287,
                0
            ],
            "description": "Sample taken from the impact point on the crystal award.",
            "forensicData": {
                "type": "BLOOD",
                "value": "Type AB+",
                "description": "Matches victim Marcus Thorne."
            }
        },
        {
            "id": "doc_forensic_shard",
            "type": EvidenceType.PAPER,
            "clues": [
                "The glass shard found in Elias's shoe is a perfect chemical and physical match to the chipped 'Deal of the Year' award, placing him at the immediate scene of the murder."
            ],
            "label": "Lab Analysis: Glass Fragment",
            "content": "A forensic laboratory report detailing the comparative analysis between a glass shard recovered from Elias Vane's footwear and the crystal award used as the murder weapon. The analysis confirms a distinct match.",
            "metadata": {
                "fields": {
                    "date": "October 14, 2024",
                    "status": "CONCLUSIVE",
                    "analyst": "Dr. Aris Chen, Trace Evidence Unit",
                    "subject": "Comparison: Footwear Debris vs. Weapon Material",
                    "findings": "METHODOLOGY:\nRefractive Index (GRIM3) and Laser Ablation Inductively Coupled Plasma Mass Spectrometry (LA-ICP-MS).\n\nSAMPLE A: Glass fragment extracted from the tread of Elias Vane's right dress shoe (Item: obj_shoes_elias).\nSAMPLE B: Control sample from the fractured base of the 'Deal of the Year' award (Item: obj_award).\n\nRESULTS:\n1. Refractive Index: Both samples exhibit an identical RI of 1.5492 (+/- 0.0001).\n2. Elemental Profile: Both samples show a unique lead-oxide (PbO) concentration consistent with high-end luxury crystal, containing identical trace impurities of Barium and Zinc not found in standard window or bottle glass.\n\nCONCLUSION:\nThe fragment recovered from the suspect's shoe is chemically and physically indistinguishable from the murder weapon. The sharp, unweathered edges of the shard indicate recent breakage, placing the shoe in the immediate vicinity of the award at the moment of impact.",
                    "caseNumber": "MAL-24-0892",
                    "evidenceId": "EV-042-S (Shoe Shard) / EV-003-W (Award)",
                    "reportType": "BALLISTICS",
                    "matchProbability": "99.99%"
                },
                "location": "Malibu PD Forensic Laboratory",
                "templateId": "forensic-report"
            },
            "position": [
                0.27357382200404495,
                1.38,
                0.059606757390269494
            ],
            "rotation": [
                0,
                1.377273225079081,
                0
            ],
            "description": "A report comparing the refractive index of the shard found in the shoe (Item: obj_shoes_elias) against the murder weapon (Item: obj_award)."
        },
        {
            "id": "doc_witness_elias",
            "type": EvidenceType.PAPER,
            "clues": [
                "Elias claims he was in the wine cellar selecting a vintage from 22:30 until he heard the commotion. This alibi conflicts with his appearance at 23:10 and the security logs."
            ],
            "label": "Statement: Elias Vane",
            "content": "Witness statement taken from Elias Vane on October 24, 2023, detailing his account of events during the merger celebration.",
            "metadata": {
                "templateId": "witness-statement",
                "fields": {
                    "header": "WITNESS STATEMENT",
                    "name": "Elias Vane",
                    "timestamp": "October 24, 2023 - 01:30 AM",
                    "officer": "Detective Sarah Chen, Badge #4421",
                    "body": "I was in the wine cellar from approximately 22:30 to 23:15, selecting a vintage Bordeaux for the estate collection. I was alone during this time—the cellar is climate-controlled and soundproofed, so I did not hear any disturbance. When I returned to the main floor around 23:10, I noticed the library door was closed and the lights were dim. I did not investigate further as I assumed Marcus and Elena wanted privacy. I rejoined the party briefly before the commotion began. I did not enter the library at any point during the evening before the discovery of the body."
                },
                "location": "Malibu Police Station - Interview Room B"
            },
            "position": [
                -0.03072797208575553,
                1.46,
                -0.12999640580075894
            ],
            "rotation": [
                0,
                -0.2668162756362116,
                0
            ],
            "description": "Transcript of the initial interview with the victim's brother-in-law."
        },
        {
            "id": "pho_crime_scene",
            "type": EvidenceType.PHOTO,
            "clues": [
                "Shows the legal documents (Motive) scattered on the floor, indicating they were being read or fought over just before the murder."
            ],
            "label": "Library Crime Scene",
            "content": "A high-resolution, wide-angle photograph capturing the interior of the Vane Estate's private library immediately following the arrival of law enforcement. The image shows the body of Marcus Thorne lying prone on the Persian rug, positioned between a heavy mahogany desk and an overturned leather armchair, indicating a struggle took place.\n\nProminently visible in the center of the frame is a chaotic spread of legal documents scattered across the floor near the victim's hands. Several pages appear crumpled, suggesting they were being held, read, or fought over in the moments preceding the murder. The background reveals floor-to-ceiling glass windows battered by the storm outside.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "October 24, 2023 - 00:45 AM",
                "notes": "Scene capture 001. Note the specific dispersal pattern of the 'Merger Agreement' documents relative to the victim's position.",
                "author": "Forensics Unit (Ofc. D. Chen)",
                "fields": null,
                "location": "Vane Estate - Private Library"
            },
            "position": [
                0.3346297019105186,
                1.54,
                0.19475355043379705
            ],
            "rotation": [
                0,
                1.1706632202590397,
                0
            ],
            "description": "Wide-angle shot of the library showing the body, the desk, and the disorganized state of the room."
        },
        {
            "id": "doc_red_herring_email",
            "type": EvidenceType.PAPER,
            "clues": [
                "Red Herring. Suggests Elena had a motive to kill Marcus to escape the marriage, diverting suspicion from Elias. However, the timestamp shows she was planning a legal exit, not a violent one."
            ],
            "label": "Email Printout: Elena Vane",
            "content": "A crumpled email printout found amongst Elena Vane's personal effects. It details a correspondence with a high-profile divorce attorney, confirming her intention to dissolve her marriage to Marcus Thorne through strictly legal channels just days before his death.",
            "metadata": {
                "fields": {
                    "to": "Julian Kaufman <j.kaufman@kaufman-family-law.com>",
                    "body": "Julian,\n\nI have reviewed the draft petition. It looks correct. I want to move forward with filing this immediately after the merger weekend concludes. I cannot stay in this house with Marcus a moment longer than necessary, but I am determined to do this by the book.\n\nHe will likely threaten to contest the pre-nup regarding the Thorne Logistics shares, but we both know he has no legal standing there. I want a clean break—no drama, no ammunition for him to claim I acted irrationally. Just get the papers ready.\n\nRegards,\nElena",
                    "date": "October 12, 2023 09:42 AM",
                    "from": "Elena Vane <elena.vane@vanecapital.net>",
                    "subject": "RE: Final Review - Petition for Dissolution",
                    "attachments": [
                        "Petition_for_Dissolution_Vane_v_Thorne.pdf",
                        "Asset_Schedule_A_CONFIDENTIAL.xlsx"
                    ]
                },
                "location": "Master Bedroom - Inside a leather folio on the bedside table",
                "templateId": "email-printout"
            },
            "position": [
                0.047650758419514806,
                1.62,
                0.12943874534299998
            ],
            "rotation": [
                0,
                -0.14699054594064997,
                0
            ],
            "description": "An email chain between Elena Vane and a divorce attorney dated two days ago."
        },
        {
            "id": "for_fingerprint_docs",
            "type": EvidenceType.FORENSIC_SAMPLE,
            "clues": [
                "The prints belong to Elias Vane, proving he held and read the documents that revealed Marcus's betrayal, triggering his rage."
            ],
            "label": "Prints on Legal Petition",
            "content": "FORENSIC LAB REPORT: ITEM #L-44 (Crumpled Documents)\n\nProcessing Method: Cyanoacrylate Fuming / UV Imaging\n\nAnalysis:\nLatent prints were successfully lifted from the right margin of the recovered legal petition. The document, which appears to have been crushed by hand, retains a high-fidelity friction ridge impression on the first page, specifically over the paragraph detailing the 'Hostile Asset Transfer'.\n\nThe positioning of the print suggests the subject was holding the paper with considerable force while reading it. The print is a Right Thumb impression displaying a distinct concentric whorl. Comparison against known exemplars collected from the guests at the Vane estate has resulted in a confirmed match.",
            "imageUrl": "PENDING",
            "metadata": {
                "forensicType": "FINGERPRINT"
            },
            "position": [
                -0.37858411563348926,
                1.7000000000000002,
                0.055055139747541226
            ],
            "rotation": [
                0,
                -0.5121240378463443,
                0
            ],
            "description": "Latent prints developed from the crumpled legal documents found on the floor.",
            "forensicData": {
                "type": "FINGERPRINT",
                "value": "Whorl-Loop-Arch",
                "description": "Right Thumb Whorl pattern. CONFIRMED MATCH to Elias Vane (suspect ID: s2)."
            }
        },
        {
            "id": "doc_news_clipping",
            "type": EvidenceType.PAPER,
            "clues": [
                "Contextual evidence explaining the high stakes. Mentions the Vane Trust is the only thing keeping the family solvent, emphasizing why the liquidation threat was lethal."
            ],
            "label": "Financial News Article",
            "content": "A clipped financial news article detailing the high stakes of the Vane-Thorne merger. It reveals that the Vane family is financially unstable and entirely dependent on the Vane Trust to remain solvent, noting that a liquidation event would destroy them.",
            "metadata": {
                "fields": {
                    "body": "The imminent finalization of the merger between Vane Capital and Thorne Logistics is being hailed by Wall Street as the deal of the decade, creating a combined entity valued in the billions. However, documents reviewed by the Journal suggest that for the Vane dynasty, this is less about expansion and more about survival.\n\nBeneath the veneer of old-world glamour, the Vane Trust—the primary vehicle of the family's wealth—appears to be the only thing keeping the family solvent. Years of quiet mismanagement have left the Trust over-leveraged and fragile. While Marcus Thorne’s capital injection promises a lifeline, his reputation as a ruthless corporate raider casts a long shadow over the proceedings.\n\nAnalysts warn that the structure of the deal leaves the Trust vulnerable. If Thorne decides to pivot toward his signature aggressive asset liquidation post-merger, rather than rehabilitation, the Vane family fortune wouldn't just diminish; it would cease to exist. For Elena Vane and her kin, the Vane Trust is the dam holding back a flood of debt, and the fear is that Thorne has just bought the rights to the floodgates.",
                    "date": "October 12, 2023",
                    "byline": "Sarah Jenkins, Senior Financial Correspondent",
                    "headline": "Vane-Thorne Merger: A Match Made in Heaven?"
                },
                "location": "Malibu, CA",
                "templateId": "news-clipping"
            },
            "position": [
                -0.3623736195241201,
                1.78,
                0.1825860571611082
            ],
            "rotation": [
                0,
                0.9093513883023584,
                0
            ],
            "description": "A clipped article from the Wall Street Journal titled 'Vane-Thorne Merger: A Match Made in Heaven?'"
        },
        {
            "id": "obj_pocket_square",
            "type": EvidenceType.OBJECT,
            "clues": [
                "Red Herring. The perfume belongs to Elena, placing her in the room, but likely earlier in the evening during the party."
            ],
            "label": "Silk Pocket Square",
            "content": "A luxurious white silk pocket square featuring a hand-rolled hem. In the bottom right corner, the initials 'M.T.' are embroidered in a navy serif font, confirming ownership by the victim, Marcus Thorne. The fabric appears slightly crumpled, sitting in a heap rather than folded, suggesting it fell or was dislodged from a pocket. It carries a lingering, distinct scent of 'Midnight Jasmine', a high-end women's perfume.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "N/A",
                "notes": "The monogram links the item to Marcus Thorne. The perfume scent is a match for Elena Vane. While this confirms she had contact with Marcus or this specific item, the scent is faint; this contact likely occurred earlier in the evening during the merger celebration rather than necessarily at the time of the murder.",
                "author": "N/A",
                "fields": null,
                "location": "Library floor, approx. 2 feet from the main double doors"
            },
            "position": [
                -0.14746471221752008,
                1.8599999999999999,
                -0.1492082958908838
            ],
            "rotation": [
                0,
                -0.7048358443935163,
                0
            ],
            "description": "Found near the door. Monogrammed 'M.T.'. Smells faintly of women's perfume."
        },
        {
            "id": "doc_bank_statement",
            "type": EvidenceType.PAPER,
            "clues": [
                "Red Herring. Suggests business rivals or shareholders might want Marcus dead, but doesn't fit the spontaneous nature of the crime scene."
            ],
            "label": "Thorne Logistics Statement",
            "content": "A crumpled monthly bank statement for Thorne Logistics dated September 2024. The document reveals aggressive financial maneuvering leading up to the merger. It shows a massive influx of cash from high-interest private equity loans, which was immediately wired out to 'Vane Acquisition Escrow'. The account balance fluctuates wildly, indicating a company leveraged to the hilt to force the deal through, potentially putting the entire combined entity at risk of insolvency if immediate returns aren't realized.",
            "metadata": {
                "fields": {
                    "bankName": "Pacific Meridian Corporate Bank",
                    "transactions": [
                        "2024-09-01 | Opening Balance | $2,150,000.00 | BALANCE",
                        "2024-09-03 | Wire Transfer: Vane Capital Escrow | -$1,500,000.00 | DEBIT",
                        "2024-09-10 | Deposit: Shadow Creek Private Equity (Bridge Loan) | +$20,000,000.00 | CREDIT",
                        "2024-09-11 | Wire Transfer: Vane Capital Escrow | -$19,000,000.00 | DEBIT",
                        "2024-09-15 | Legal Retainer: Sterling & Partners | -$150,000.00 | DEBIT",
                        "2024-09-22 | Interest Pmt: Series B Bonds | -$450,000.00 | DEBIT",
                        "2024-09-28 | Consulting Fee: M. Thorne Personal | -$350,000.00 | DEBIT",
                        "2024-09-29 | Wire Transfer: Cayman Holdings IV | -$50,000.00 | DEBIT",
                        "2024-09-30 | Account Service Fee | -$10,000.00 | DEBIT"
                    ],
                    "accountHolder": "Thorne Logistics - Executive Operating Fund",
                    "accountNumber": "8990-2342-1185",
                    "endingBalance": "$1,640,000.00",
                    "startingBalance": "$2,150,000.00",
                    "statementPeriod": "September 1, 2024 - September 30, 2024"
                },
                "location": "Thorne Estate - Private Library Desk",
                "templateId": "bank-statement"
            },
            "position": [
                0.3202749485023101,
                1.94,
                -0.16484733198229568
            ],
            "rotation": [
                0,
                -0.48752835179382487,
                0
            ],
            "description": "Monthly statement showing massive debt leveraging against the merger."
        }
    ],
    "solution": {
        "motive": "Discovery of legal documents on Marcus's desk revealing a plot to institutionalize Elena and liquidate the Vane family trust.",
        "weaponId": "obj_award",
        "culpritId": "s2",
        "reasoning": "While everyone had a reason to hate Marcus, the timeline and physical evidence point to Elias. The security camera was disabled at 22:50, a system only family members knew how to operate blindly. Elias's alibi of being in the wine cellar was a lie; he was seen returning to the party at 23:10 appearing flustered. During the confrontation in the library, Elias found the divorce and liquidation papers. In a fit of protective rage, he struck Marcus with the heavy crystal award on the desk. Crucially, a shard of unique glass from the award was found embedded in the sole of Elias's dress shoe."
    },
    "suspects": [
        {
            "id": "s1",
            "bio": "The Wife. Years of emotional abuse and the rumor that Marcus was planning to divorce her and take full custody of their assets.. Alibi: Claims she was in the master bedroom taking a sedative after her crying spell.",
            "name": "Elena Thorne",
            "notes": "The Wife",
            "bloodType": "A-",
            "dnaSequence": "ATGC-TATA-CGAT-GGTA-ATAC-GCAT",
            "fingerprintPattern": "Loop-Arch-Whorl"
        },
        {
            "id": "s2",
            "bio": "The Brother-in-Law. To protect his sister Elena and the Vane family legacy from Marcus's predatory financial restructuring.. Alibi: States he was checking on the vintage wine collection in the cellar alone.",
            "name": "Elias Vane",
            "notes": "The Brother-in-Law",
            "bloodType": "O+",
            "dnaSequence": "GGTA-ATAC-GCAT-TATA-CGAT-ATGC",
            "fingerprintPattern": "Whorl-Loop-Arch"
        },
        {
            "id": "s3",
            "bio": "CFO of Thorne Logistics. Marcus was setting her up to take the fall for embezzlement he committed.. Alibi: Was on a conference call with overseas investors on the terrace (corroborated by phone logs).",
            "name": "Sarah Jara",
            "notes": "CFO of Thorne Logistics",
            "bloodType": "B+",
            "dnaSequence": "CGAT-GGTA-TATA-ATAC-GCAT-ATGC",
            "fingerprintPattern": "Arch-Whorl-Loop"
        },
        {
            "id": "s4",
            "bio": "Executive Assistant/Mistress. Marcus promised to leave Elena for her but brutally ended their affair that night.. Alibi: Sitting at the bar with the bartender, drinking heavily from 22:40 onwards.",
            "name": "Chloe Desoto",
            "notes": "Executive Assistant/Mistress",
            "bloodType": "AB+",
            "dnaSequence": "ATAC-GCAT-ATGC-CGAT-TATA-GGTA",
            "fingerprintPattern": "Loop-Whorl-Arch"
        },
        {
            "id": "s5",
            "bio": "Rival Tech Entrepreneur. Marcus stole proprietary code that bankrupted Kenji's previous startup.. Alibi: Playing billiards with two other guests in the game room during the time of the murder.",
            "name": "Kenji Sato",
            "notes": "Rival Tech Entrepreneur",
            "bloodType": "O-",
            "dnaSequence": "TATA-CGAT-GGTA-ATAC-GCAT-ATGC",
            "fingerprintPattern": "Arch-Loop-Whorl"
        }
    ],
    "difficulty": "Hard"
}