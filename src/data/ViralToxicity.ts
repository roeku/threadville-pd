import {CaseFile, EvidenceType} from "@/types";

export const VIRAL_TOXICITY : CaseFile = {
    "title": "Viral Toxicity: The Last Stream",
    "caseId": "CASE-1769674959756",
    "status": "draft",
    "briefing": "The internet was watching when Jaxson 'Jax' Vane, the world's most popular lifestyle streamer, collapsed live on camera during the launch of his signature energy drink, 'VaneGlory'. Just moments after cracking open the golden promotional can and taking a long swig, Jax began to convulse, foaming at the mouth before 2.4 million horrified viewers. The livestream cut to black, but not before the chat exploded with accusations. By the time paramedics arrived at the ultra-modern 'Prism Penthouse' content house, Jax was dead.\n\nDetective, the penthouse was locked down immediately. No one left the premises. The medical examiner has confirmed that Jax didn't die of natural causes; he was poisoned with a lethal dose of concentrated nicotine, likely extracted from vape fluids, which caused immediate cardiac arrest. The poison wasn't in the manufacturing batch of the drink—it was introduced at the scene. Five people had access to the staging area. You need to sift through the forensic timeline and motives to find the killer among the entourage.",
    "entities": [
        {
            "id": "DOC-001",
            "type": EvidenceType.PAPER,
            "clues": [
                "Establishes the timeline and the fact that the death occurred immediately after ingestion, suggesting a fast-acting poison."
            ],
            "label": "Case File Summary: Jaxson Vane",
            "content": "CASE SUMMARY: JAXSON VANE\n\nVictim: Jaxson 'Jax' Vane\nLocation: Prism Penthouse, Main Lounge (Livestream Staging Area)\nIncident Type: Homicide / Suspicious Death\n\nOverview:\nOn the evening of October 24th, during a global livestream event for the launch of 'VaneGlory', the victim collapsed immediately after ingesting the promotional beverage. The reaction was instantaneous—convulsions followed by foaming at the mouth and cardiac arrest within seconds. This timeline confirms the presence of an extremely fast-acting toxin, ruling out slow-release agents. \n\nPreliminary toxicology indicates a lethal dose of concentrated nicotine. The poison was introduced at the scene, not during manufacturing. The penthouse was locked down immediately following the event; no suspects entered or left. The investigation is confined to the five individuals present in the staging area at the time of death.",
            "metadata": {
                "fields": {
                    "title": "Viral Toxicity: The Last Stream",
                    "caseNumber": "CR-24-VAN-01",
                    "assignedTeam": [
                        "Medical Examiner"
                    ],
                    "leadInvestigator": "Detective"
                },
                "location": "Prism Penthouse - Evidence Board / Entry Table (File Start Location for Player Interaction, typically 'Inventory' or 'Crime Scene' depending on game state, mapped to physical location: 0.9, 0.048, -0.328 as per input data). Localized: 'Prism Penthouse - Foyer'. Case file resides in inventory after pickup. For this field: 'Prism Penthouse - Foyer'.\n\n(Note: Strictly following schema types below, ignoring verbose location description logic if simpler string required. Set to 'Prism Penthouse - Foyer'.)\n\nCorrected Location: Prism Penthouse - Foyer\nTemplateId preservation: case-file-cover (Implicitly required for rendering, added to metadata object). Note: Schema provided in context does not explicitly list templateId but context instructions imply its necessity. Adding as sibling to fields.)\n\nActually, strictly adhering to the schema provided in the context block which does NOT list templateId inside metadata properties, but the prompt implies this is an enrichment of an existing item. I will populate the required schema fields. The engine likely merges this. \n\nFinal Decision: Populate required schema fields exactly. \n\nLocation: 'Prism Penthouse - Foyer'",
                "templateId": "case-file-cover"
            },
            "position": [
                -0.3926799422107823,
                0.9,
                0.04875887077220031
            ],
            "rotation": [
                0,
                -0.328411229105897,
                0
            ],
            "description": "Initial case summary outlining the victim, location (Prism Penthouse), and immediate circumstances of the death during the livestream."
        },
        {
            "id": "DOC-002",
            "type": EvidenceType.PAPER,
            "clues": [
                "Toxicology confirms death by acute nicotine poisoning. Crucially, the report notes chemical burns on the lips and tongue, but lower concentrations in the stomach, suggesting the poison was contacted first, not fully digested from the liquid volume."
            ],
            "label": "Medical Examiner's Autopsy Report",
            "content": "Official pathology report regarding the death of Jaxson Vane. The document details the external examination, internal organ analysis, and toxicology screening, concluding that death was caused by acute nicotine poisoning introduced orally.",
            "metadata": {
                "fields": {
                    "caseNumber": "ME-24-1024-JV",
                    "dateOfDeath": "October 24, 2024",
                    "timeOfDeath": "20:14 EST",
                    "causeOfDeath": "Acute Nicotine Toxicity leading to Cardiac Arrest",
                    "decedentName": "Jaxson 'Jax' Vane",
                    "examinerName": "Dr. Aris Thorne, Chief Medical Examiner",
                    "mannerOfDeath": "Homicide",
                    "toxicologyNotes": "Blood serum analysis reveals a lethal nicotine concentration of 65 mg/L. Routine screen negative for alcohol or other narcotics. The significant disparity between the severe chemical burns in the mouth and the lower relative concentration in the stomach contents suggests the poison was extremely potent and contacted first, causing immediate incapacitation rather than being fully digested from the liquid volume.",
                    "externalFindings": "The body is that of a well-nourished 24-year-old male. Cyanosis is evident in the extremities and lips. Dried froth is present around the mouth. Most notably, there are distinct chemical burns and blistering on the mucosal lining of the lips, gums, and the anterior dorsal surface of the tongue. No defensive wounds or signs of external struggle were observed.",
                    "internalFindings": "Pulmonary edema is present with frothy fluid in the bronchi. The heart displays petechial hemorrhages consistent with sudden, violent cardiac arrest. The stomach contains approximately 150ml of golden, carbonated liquid. While gastric mucosa shows mild irritation, it lacks the severe corrosive damage seen in the oral cavity, indicating the victim went into shock before the bulk of the toxin could be fully processed by the stomach."
                },
                "location": "Office of the Chief Medical Examiner, City Morgue",
                "templateId": "autopsy-report"
            },
            "position": [
                0.16711798993048596,
                0.98,
                -0.18872310573204643
            ],
            "rotation": [
                0,
                1.5535297421436207,
                0
            ],
            "description": "Detailed pathology report for Jaxson Vane. Note the toxicology section."
        },
        {
            "id": "OBJ-001",
            "type": EvidenceType.OBJECT,
            "clues": [
                "The physical vessel for the poison. It needs to be tested to see if the poison was in the drink or on the container."
            ],
            "label": "Golden 'VaneGlory' Can",
            "content": "EVIDENCE RECORD: OBJ-001\n\nITEM DESCRIPTION:\nA 16oz aluminum beverage can featuring a custom, high-gloss gold shrink wrap with the 'VaneGlory' logo. The pull-tab is engaged (open). Approximately 45ml of amber liquid remains inside.\n\nFORENSIC ANALYSIS:\n1. LIQUID CONTENTS: Mass spectrometry of the remaining fluid reveals standard energy drink components (caffeine, taurine, sucrose, B-vitamins). No foreign toxic agents detected within the liquid itself.\n\n2. EXTERNAL SURFACE: A swab of the drinking rim/mouthpiece returned a POSITIVE result for high-concentration Nicotine (C10H14N2). The substance appears to have been smeared directly onto the lip of the can in a viscous suspension (likely vape refill fluid).\n\n3. LATENT PRINTS: Multiple friction ridge impressions recovered from the can body matching the victim, Jaxson Vane. One partial, smudged print recovered near the bottom rim (insufficient minutiae for immediate ID).\n\nCONCLUSION:\nThe vessel itself was the delivery vector. The poison was applied topically to the rim, not introduced into the manufacturing batch.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "2023-11-14",
                "notes": "Collected directly from the desk mat where the victim collapsed. Bagged and sealed for lab analysis. Chain of custody intact.",
                "author": "CST L. Miller",
                "fields": null,
                "location": "Prism Penthouse - Streaming Desk (Sector A)"
            },
            "position": [
                0.3852764979198205,
                1.06,
                -0.029325629517266194
            ],
            "rotation": [
                0,
                0.5129191792583553,
                0
            ],
            "description": "The promotional 'Hero Can' Jax drank from. It is an open aluminum can with a custom gold wrap."
        },
        {
            "id": "DOC-003",
            "type": EvidenceType.PAPER,
            "clues": [
                "The liquid inside is clean. However, a lethal concentration of 99% pure liquid nicotine was swabbed from the *rim* and the *tab* of the can."
            ],
            "label": "Forensic Lab Report: Can Analysis",
            "content": "Forensic toxicology report regarding the 'VaneGlory' can found at the scene. The liquid contents of the beverage were tested and found to be free of contaminants. However, chemical analysis of the exterior surfaces—specifically the drinking rim and the pull-tab—revealed the presence of a highly concentrated toxin identified as 99% pure liquid nicotine.",
            "metadata": {
                "fields": {
                    "date": "2024-05-12",
                    "status": "CONCLUSIVE",
                    "analyst": "Dr. Aris Thorne",
                    "subject": "Golden 'VaneGlory' Can (Promotional Unit)",
                    "findings": "SAMPLE A (Liquid Contents): Gas chromatography-mass spectrometry (GC-MS) analysis reveals standard carbohydrate and electrolyte profile consistent with 'VaneGlory' formula. No toxins detected.\n\nSAMPLE B (Exterior Swab - Rim & Tab): Swabs taken from the aluminum aperture rim and pull-tab mechanism tested positive for Nicotine (C10H14N2). Analysis indicates a purity level of 99%, consistent with pharmaceutical-grade or concentrated extraction vape fluid. The estimated surface concentration recovered (approx. 60mg) is sufficient to cause lethal cardiac arrest upon oral mucosal contact.",
                    "caseNumber": "CS-24-0511-JV",
                    "evidenceId": "EVID-003-CAN",
                    "reportType": "TOXICOLOGY",
                    "matchProbability": "N/A"
                },
                "location": "Forensic Laboratory - Toxicology Unit",
                "templateId": "forensic-report"
            },
            "position": [
                -0.1829919679466844,
                1.1400000000000001,
                0.10086556710398886
            ],
            "rotation": [
                0,
                -0.8073979000144543,
                0
            ],
            "description": "Chemical analysis of the Golden Can contents and exterior surfaces."
        },
        {
            "id": "OBJ-002",
            "type": EvidenceType.OBJECT,
            "clues": [
                "The cloth is damp and has a faint chemical odor. This is the murder weapon used to apply the poison to the can rim."
            ],
            "label": "Blue Microfiber Cloth",
            "content": "A crumpled, standard blue microfiber cleaning cloth, approximately 15cm by 15cm. The fabric is balled up and heavily wrinkled, suggesting it was hastily stowed away. The material is damp to the touch, specifically in the center, and saturated with a colorless, oily substance. It emits a faint, acrid chemical odor characteristic of concentrated nicotine or unflavored vape fluid. Under magnification, microscopic flecks of gold metallic pigment are visible caught within the synthetic weave.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "October 24, 2023",
                "notes": "Lab analysis confirms the oily residue is a lethal concentration of liquid nicotine, matching the toxin found in the victim's system. The gold particulate matches the exterior paint of the VaneGlory can. This cloth is the murder weapon used to apply the poison to the can rim.",
                "author": "Forensics Unit",
                "fields": null,
                "location": "Maya Torres (Back Pocket)"
            },
            "position": [
                -0.1928567142436359,
                1.22,
                -0.11601893679008263
            ],
            "rotation": [
                0,
                1.4633832006199987,
                0
            ],
            "description": "A crumpled blue cleaning cloth found in the back pocket of Maya Torres during the initial search."
        },
        {
            "id": "SMP-001",
            "type": EvidenceType.FORENSIC_SAMPLE,
            "clues": [
                "Identifies the user of the cloth. The DNA matches Maya Torres, proving she handled the cloth used to poison the can."
            ],
            "label": "DNA Swab from Microfiber Cloth",
            "content": "FORENSIC BIOLOGY REPORT\nCASE REF: VT-2024-JX\nSAMPLE ID: SMP-001\n\nITEM RECEIVED:\nOne (1) blue microfiber cleaning cloth collected from the Prism Penthouse staging area.\n\nEXAMINATION REQUESTED:\nDNA extraction and profiling to identify handler.\n\nANALYSIS:\nSample collected via swabbing from the central portion of the fabric, where skin contact pressure appeared highest. Epithelial cells were successfully isolated. Short Tandem Repeat (STR) analysis was performed to generate a genetic profile.\n\nRESULTS:\nA full single-source DNA profile was obtained. The profile indicates the cloth was handled extensively by a female contributor.\n\nCOMPARISON:\nThe evidence profile was compared against reference samples on file.\n- MATCH CONFIRMED: The profile corresponds to Maya Torres (Suspect S1).\n\nCONCLUSION:\nThe biological material on the microfiber cloth identifies Maya Torres as the primary handler.",
            "imageUrl": "PENDING",
            "metadata": {
                "forensicType": "DNA"
            },
            "position": [
                -0.3975560492400339,
                1.3,
                -0.18080634388337768
            ],
            "rotation": [
                0,
                -0.7883741321536635,
                0
            ],
            "description": "Epithelial cells extracted from the center of the blue microfiber cloth.",
            "forensicData": {
                "type": "DNA",
                "value": "CTAT-ATAG-CAAT-TTGA",
                "description": "Profile matches Suspect S1 (Maya Torres)."
            }
        },
        {
            "id": "DOC-004",
            "type": EvidenceType.PAPER,
            "clues": [
                "Boring list anomaly. Amidst the spam, timestamp 14:03:12 User 'Simp4Jax' writes: 'Why is Maya rubbing that can for so long? It's already shiny lol.' This places Maya handling the can just before the stream started."
            ],
            "label": "Twitch Chat Logs (14:00 - 14:15)",
            "content": "A massive log of user comments from the stream chat leading up to the event. Thousands of lines of emotes and text.",
            "metadata": {
                "templateId": "server-log"
            },
            "position": [
                0.053370765870390184,
                1.38,
                -0.16558598869440277
            ],
            "rotation": [
                0,
                -0.22848776308581292,
                0
            ],
            "description": "A massive log of user comments from the stream chat leading up to the event. Thousands of lines of emotes and text."
        },
        {
            "id": "OBJ-003",
            "type": EvidenceType.OBJECT,
            "clues": [
                "Red Herring. Establishes a source of nicotine on set, making Aris a suspect due to availability of the chemical."
            ],
            "label": "Dr. Aris Thorne's Vape Mod",
            "content": "A heavy, high-end 'box mod' vaporizer constructed from brushed titanium with a custom carbon fiber grip. The device features an enlarged, aftermarket 8ml glass tank, currently filled with a viscous, dark amber liquid. A digital OLED screen on the side displays 'A. Thorne - Profile 1' and is set to 85 Watts. The smell of rich tobacco and vanilla is potent even without activating the firing button. The tank cap shows signs of frequent unscrewing, and the threading is slightly worn, indicating the user mixes or refills their own liquids manually rather than using pre-sealed cartridges.",
            "imageUrl": "PENDING",
            "metadata": {
                "date": "Present Day",
                "notes": "Field test confirms the tank contains a highly concentrated 50mg/ml nicotine salt solution mixed with vegetable glycerin. While legal for personal use in custom rigs, the liquid inside is toxic enough to cause cardiac arrest if ingested orally in a concentrated dose. This places a lethal amount of the poison directly in Thorne's possession.",
                "author": "Dr. Aris Thorne",
                "fields": null,
                "location": "Dr. Aris Thorne's Leather Satchel (Side Pocket)"
            },
            "position": [
                0.26427722083196914,
                1.46,
                0.19669148221014432
            ],
            "rotation": [
                0,
                -1.407701894451298,
                0
            ],
            "description": "A high-end, custom-modified vaporizer found in Dr. Thorne's bag."
        },
        {
            "id": "SMP-002",
            "type": EvidenceType.FORENSIC_SAMPLE,
            "clues": [
                "Confirms ownership and recent usage by Dr. Thorne, reinforcing the red herring that he brought the chemicals to the scene."
            ],
            "label": "Fingerprint on Vape Mod",
            "content": "Lab Report: Latent Print Analysis\n\nItem: SMP-002 (Vape Mod - Glass Tank)\nMethod: Cyanoacrylate Fuming / Powder Lift\n\nA distinct latent fingerprint was recovered from the glass reservoir of the custom vaporizer device found on the sidebar table. The surface provided a high-quality lift. \n\nThe print pattern consists of a double loop arch. Automated Fingerprint Identification System (AFIS) comparison and manual verification confirmed a match to the elimination prints provided by Dr. Aris Thorne. The placement suggests the device was held firmly, consistent with refilling or adjusting the tank mechanism.",
            "imageUrl": "PENDING",
            "metadata": {
                "forensicType": "FINGERPRINT"
            },
            "position": [
                -0.09401997023386972,
                1.54,
                -0.12068974449993797
            ],
            "rotation": [
                0,
                0.8950119154302115,
                0
            ],
            "description": "Latent print lifted from the glass tank of the vaporizer.",
            "forensicData": {
                "type": "FINGERPRINT",
                "value": "LOOP-LOOP-ARCH",
                "description": "Match confirmed for Dr. Aris Thorne."
            }
        },
        {
            "id": "DOC-005",
            "type": EvidenceType.PAPER,
            "clues": [
                "Reveals the motive. Maya claims she invented the 'VaneGlory' formula and branding, but Jax cut her out of the equity. She expresses deep rage and a desire to 'destroy his launch'."
            ],
            "label": "Unsent Email Draft",
            "content": "A crumpled printout of an unsent email draft recovered from Maya Torres's laptop. It is addressed to a legal aid organization and details her allegations of intellectual property theft against Jaxson Vane regarding the 'VaneGlory' energy drink.",
            "metadata": {
                "fields": {
                    "to": "case-intake@citylegalaid.org",
                    "body": "To Whom It May Concern,\n\nI need immediate legal representation. I cannot afford a corporate retainer, which is exactly what my business partner is counting on.\n\nI am the creator of the 'VaneGlory' formula. I did the chemistry, I designed the branding, I built the identity. Jaxson Vane was just the face. We had a verbal agreement for 30% equity, but I found out yesterday that he has restructured the company without me. He's cut me out of the equity entirely.\n\nI am shaking with rage right now. He thinks he can steal my life's work just because he has the cameras and the followers? I won't let him win. I don't care about the NDA anymore. If I can't get what I'm owed, I am going to destroy his launch. I know exactly how this product was made, and I know what will hurt him.\n\nPlease contact me as soon as possible. The launch is in 48 hours.\n\nSincerely,\nMaya Torres",
                    "date": "October 24, 2023, 11:42 PM",
                    "from": "Maya Torres <maya.creative.flow@gmail.com>",
                    "subject": "URGENT: IP Theft / Wrongful Exclusion - Jaxson Vane",
                    "attachments": [
                        "original_formula_notes.pdf",
                        "equity_promise_screenshot.jpg"
                    ]
                },
                "location": "Prism Penthouse - Maya's Workstation",
                "templateId": "email-printout"
            },
            "position": [
                -0.3490550486117925,
                1.62,
                -0.14593243921485477
            ],
            "rotation": [
                0,
                1.283037398028534,
                0
            ],
            "description": "Printout of an email found on Maya Torres's laptop, addressed to 'Legal Aid'."
        },
        {
            "id": "SMP-003",
            "type": EvidenceType.FORENSIC_SAMPLE,
            "clues": [
                "Red Herring. Places Kairos at the beverage storage, suggesting opportunity."
            ],
            "label": "Fingerprint on Mini-Fridge",
            "content": "Evidence Log: Latent fingerprint lifted from the brushed aluminum handle of the mini-fridge located in the staging area, specifically the unit housing the VaneGlory promotional stock. The print was developed using cyanoacrylate fuming followed by dusting. Analysis reveals a clear impression of a right index finger. Comparison with known samples confirms a positive identification for Kairos, establishing that he accessed the beverage storage prior to the livestream event.",
            "imageUrl": "PENDING",
            "metadata": {
                "forensicType": "FINGERPRINT"
            },
            "position": [
                -0.18467486449137915,
                1.7000000000000002,
                0.2383850130093979
            ],
            "rotation": [
                0,
                0.8275841063612355,
                0
            ],
            "description": "Print found on the handle of the fridge where the cans were stored.",
            "forensicData": {
                "type": "FINGERPRINT",
                "value": "WHORL-ARCH-WHORL",
                "description": "Match confirmed for Kairos."
            }
        },
        {
            "id": "DOC-006",
            "type": EvidenceType.PAPER,
            "clues": [
                "She insists the security was tight and tries to implicate Dr. Thorne, mentioning she saw him 'fiddling with his vape juice' near the drinks. Deflection."
            ],
            "label": "Witness Statement: Elena Rostov",
            "content": "Interview transcript with the victim's manager/financier.",
            "metadata": {
                "templateId": "witness-statement"
            },
            "position": [
                0.1630439658507867,
                1.78,
                0.05410997824964425
            ],
            "rotation": [
                0,
                0.5706740802210589,
                0
            ],
            "description": "Interview transcript with the victim's manager/financier."
        },
        {
            "id": "DOC-007",
            "type": EvidenceType.PAPER,
            "clues": [
                "The results (attached) show the nicotine on the cloth is a 99% pure industrial concentrate, whereas Thorne's vape juice is a diluted 3% commercial blend. This rules out Thorne's personal stash as the direct murder weapon, pointing to a premeditated external source."
            ],
            "label": "Lab Submission Form #9921",
            "content": "Request form for comparison of chemicals found on the Microfiber Cloth vs. Dr. Thorne's Vape Liquid.",
            "metadata": {
                "templateId": "lab-submission-form"
            },
            "position": [
                0.0836607545746107,
                1.8599999999999999,
                -0.1829558559881777
            ],
            "rotation": [
                0,
                -0.9654489378955913,
                0
            ],
            "description": "Request form for comparison of chemicals found on the Microfiber Cloth vs. Dr. Thorne's Vape Liquid."
        },
        {
            "id": "SMP-004",
            "type": EvidenceType.FORENSIC_SAMPLE,
            "clues": [
                "Matches Elena Rostov. Likely from a nervous nosebleed or shaving nick. Red herring to add biological noise to the scene."
            ],
            "label": "Blood Swab on Tissue",
            "content": "FORENSIC LAB REPORT: SMP-004\n\nITEM: Biological Sample on Tissue\nLOCATION: Bathroom Wastebasket, Prism Penthouse\n\nVISUAL EXAMINATION:\nEvidence consists of a crumpled white facial tissue containing a small, localized reddish-brown stain approximately 5mm in diameter. No other biological fluids detected on the substrate.\n\nANALYSIS:\nPresumptive testing returned positive for hemoglobin. Confirmatory testing verified human blood.\n\nSEROLOGY & DNA:\nThe sample yielded a complete genetic profile. \nBlood Type identified: A Negative (A-).\n\nCOMPARISON:\nSTR analysis was performed on the extracted DNA. The resulting profile matches the reference sample obtained from Elena Rostov. The small volume is consistent with minor capillary bleeding (e.g., nosebleed or nick).",
            "imageUrl": "PENDING",
            "metadata": {
                "forensicType": "BLOOD"
            },
            "position": [
                -0.10694281395745549,
                1.94,
                -0.04331972890683816
            ],
            "rotation": [
                0,
                1.1705184155376747,
                0
            ],
            "description": "Small spot of blood found on a tissue in the bathroom trash.",
            "forensicData": {
                "type": "BLOOD",
                "value": "A-",
                "description": "Type A Negative. DNA Markers match Elena Rostov."
            }
        },
        {
            "id": "PHO-001",
            "type": EvidenceType.PHOTO,
            "clues": [
                "Visualizes the opportunity. Shows Maya stood directly next to the 'Hero Can' placement spot, while others were behind the lighting rigs."
            ],
            "label": "Crime Scene Sketch: Staging Area",
            "content": "Diagram showing the proximity of suspects to the desk 5 minutes prior to air.",
            "imageUrl": "PENDING",
            "metadata": {
                "templateId": "crime-scene-sketch"
            },
            "position": [
                -0.06549749801388378,
                2.02,
                0.12577462457133715
            ],
            "rotation": [
                0,
                -0.7048980429523232,
                0
            ],
            "description": "Diagram showing the proximity of suspects to the desk 5 minutes prior to air."
        }
    ],
    "solution": {
        "motive": "Intellectual Property Theft and Revenge",
        "weaponId": "OBJ-002",
        "culpritId": "S1",
        "reasoning": "While Aris had the chemical knowledge, the forensic evidence pointed to the method of delivery. The toxicology report showed the poison was on the *rim* of the can, not in the liquid. Timeline analysis confirms Maya Torres was the only person to handle the 'Hero Can' specifically to 'polish' it. Forensics found high concentrations of nicotine residue on the microfiber cloth found in Maya's back pocket. She applied the poison while pretending to clean the can for the camera, knowing Jax would drink directly from the opening."
    },
    "suspects": [
        {
            "id": "S1",
            "bio": "Personal Assistant. Financial abuse; Jax hadn't paid her in six months and stole her idea for the beverage brand.. Alibi: Claimed she was in the server room monitoring chat moderation logs when the collapse happened.",
            "name": "Maya Torres",
            "notes": "Personal Assistant",
            "bloodType": "O+",
            "dnaSequence": "PENDING",
            "fingerprintPattern": "PENDING"
        },
        {
            "id": "S2",
            "bio": "Rival Streamer. Professional jealousy; losing his top sponsor to Jax's new brand.. Alibi: Was on his own IRL stream in the adjacent room, confirmed by his VOD timestamp.",
            "name": "Kairos",
            "notes": "Rival Streamer",
            "bloodType": "O+",
            "dnaSequence": "PENDING",
            "fingerprintPattern": "PENDING"
        },
        {
            "id": "S3",
            "bio": "Brand Manager. Corporate risk; Jax was threatening to breach contract and sign with a competitor live on air.. Alibi: Was on a conference call with the board of directors on the balcony.",
            "name": "Elena Rostov",
            "notes": "Brand Manager",
            "bloodType": "O+",
            "dnaSequence": "PENDING",
            "fingerprintPattern": "PENDING"
        },
        {
            "id": "S4",
            "bio": "Nutritionist/Chemist. Personal vendetta; Jax's ex-boyfriend who was dumped publicly and humiliated.. Alibi: Was in the kitchen preparing post-stream meals, captured on the smart-fridge security cam.",
            "name": "Dr. Aris Thorne",
            "notes": "Nutritionist/Chemist",
            "bloodType": "O+",
            "dnaSequence": "PENDING",
            "fingerprintPattern": "PENDING"
        },
        {
            "id": "S5",
            "bio": "Technical Director. Workplace toxicity; Jax frequently blamed her for technical failures and ruined her reputation.. Alibi: Was behind the mixing desk controlling the camera switching during the broadcast.",
            "name": "Zoe Chen",
            "notes": "Technical Director",
            "bloodType": "O+",
            "dnaSequence": "PENDING",
            "fingerprintPattern": "PENDING"
        }
    ],
    "difficulty": "Hard"
}