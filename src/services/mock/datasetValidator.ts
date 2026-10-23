export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
}

export function validateDataset(dataset: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts: Record<string, number> = {};

  const idSet = new Set<string>();

  const registerId = (id: string, collectionName: string) => {
    if (!id) {
      errors.push(`[${collectionName}] Found item with missing or undefined ID.`);
      return;
    }
    if (idSet.has(id)) {
      errors.push(`[${collectionName}] Duplicate ID detected: "${id}".`);
    } else {
      idSet.add(id);
    }
  };

  // 1. Users
  const userIds = new Set<string>();
  const usersList = dataset.users as Record<string, unknown>[];
  if (Array.isArray(usersList)) {
    counts.users = usersList.length;
    usersList.forEach((u) => {
      const uid = String(u.id || '');
      registerId(uid, 'USERS');
      userIds.add(uid);
      if (!u.name || !u.role || !u.email) {
        errors.push(`[USERS] User ${uid} missing required name/role/email.`);
      }
    });
  } else {
    errors.push('[USERS] Missing or invalid USERS section.');
  }

  // 2. Cases
  const caseIds = new Set<string>();
  const casesList = dataset.cases as Record<string, unknown>[];
  if (Array.isArray(casesList)) {
    counts.cases = casesList.length;
    casesList.forEach((c) => {
      const cid = String(c.caseId || '');
      registerId(cid, 'CASES');
      caseIds.add(cid);
      if (c.assignedInvestigator && !userIds.has(String(c.assignedInvestigator))) {
        errors.push(`[CASES] Case ${cid} references unknown assignedInvestigator "${c.assignedInvestigator}".`);
      }
    });
  } else {
    errors.push('[CASES] Missing or invalid CASES section.');
  }

  // 3. All Entities
  const entityIds = new Set<string>();

  const registerEntities = (items: Record<string, unknown>[] | undefined, collectionName: string, idProp: string) => {
    if (Array.isArray(items)) {
      counts[collectionName] = items.length;
      items.forEach((e) => {
        const eid = String(e[idProp] || '');
        registerId(eid, collectionName);
        if (eid) entityIds.add(eid);

        if (Array.isArray(e.caseIds)) {
          e.caseIds.forEach((cid: unknown) => {
            if (!caseIds.has(String(cid))) {
              errors.push(`[${collectionName}] Entity ${eid} references unknown caseId "${cid}".`);
            }
          });
        }
      });
    }
  };

  registerEntities(dataset.personEntities as Record<string, unknown>[], 'PERSON_ENTITIES', 'entityId');
  registerEntities(dataset.phoneEntities as Record<string, unknown>[], 'PHONE_ENTITIES', 'phoneId');
  registerEntities(dataset.emailEntities as Record<string, unknown>[], 'EMAIL_ENTITIES', 'emailId');
  registerEntities(dataset.vehicles as Record<string, unknown>[], 'VEHICLES', 'vehicleId');
  registerEntities(dataset.bankAccounts as Record<string, unknown>[], 'BANK_ACCOUNTS', 'bankAccountId');
  registerEntities(dataset.upiIds as Record<string, unknown>[], 'UPI_IDS', 'upiId');
  registerEntities(dataset.cryptoWallets as Record<string, unknown>[], 'CRYPTO_WALLETS', 'walletId');
  registerEntities(dataset.organizations as Record<string, unknown>[], 'ORGANIZATIONS', 'organizationId');
  registerEntities(dataset.devices as Record<string, unknown>[], 'DEVICES', 'deviceId');
  registerEntities(dataset.socialAccounts as Record<string, unknown>[], 'SOCIAL_ACCOUNTS', 'socialAccountId');

  // 4. Locations
  const locationIds = new Set<string>();
  const locationsList = dataset.locations as Record<string, unknown>[];
  if (Array.isArray(locationsList)) {
    counts.locations = locationsList.length;
    locationsList.forEach((l) => {
      const lid = String(l.locationId || '');
      registerId(lid, 'LOCATIONS');
      locationIds.add(lid);
      if (Array.isArray(l.caseIds)) {
        l.caseIds.forEach((cid: unknown) => {
          if (!caseIds.has(String(cid))) {
            errors.push(`[LOCATIONS] Location ${lid} references unknown caseId "${cid}".`);
          }
        });
      }
    });
  }

  // 5. Evidence Records
  const evidenceIds = new Set<string>();
  const evidenceList = dataset.evidenceRecords as Record<string, unknown>[];
  if (Array.isArray(evidenceList)) {
    counts.evidenceRecords = evidenceList.length;
    evidenceList.forEach((ev) => {
      const evid = String(ev.evidenceId || '');
      registerId(evid, 'EVIDENCE');
      evidenceIds.add(evid);
      if (ev.caseId && !caseIds.has(String(ev.caseId))) {
        errors.push(`[EVIDENCE] Evidence ${evid} references unknown caseId "${ev.caseId}".`);
      }
      if (Array.isArray(ev.linkedEntityIds)) {
        ev.linkedEntityIds.forEach((eid: unknown) => {
          if (!entityIds.has(String(eid))) {
            errors.push(`[EVIDENCE] Evidence ${evid} references unknown linkedEntityId "${eid}".`);
          }
        });
      }
    });
  }

  // 6. Relationships
  const relationshipIds = new Set<string>();
  const relsList = dataset.relationships as Record<string, unknown>[];
  if (Array.isArray(relsList)) {
    counts.relationships = relsList.length;
    relsList.forEach((r) => {
      const rid = String(r.relationshipId || '');
      registerId(rid, 'RELATIONSHIPS');
      relationshipIds.add(rid);
      if (r.sourceEntityId && !entityIds.has(String(r.sourceEntityId))) {
        errors.push(`[RELATIONSHIPS] Relationship ${rid} references unknown sourceEntityId "${r.sourceEntityId}".`);
      }
      if (r.targetEntityId && !entityIds.has(String(r.targetEntityId))) {
        errors.push(`[RELATIONSHIPS] Relationship ${rid} references unknown targetEntityId "${r.targetEntityId}".`);
      }
    });
  }

  // 7. Timeline Events
  const timelineList = dataset.timelineEvents as Record<string, unknown>[];
  if (Array.isArray(timelineList)) {
    counts.timelineEvents = timelineList.length;
    timelineList.forEach((evt) => {
      const eventId = String(evt.eventId || '');
      registerId(eventId, 'TIMELINE_EVENTS');
      if (evt.caseId && !caseIds.has(String(evt.caseId))) {
        errors.push(`[TIMELINE] Timeline event ${eventId} references unknown caseId "${evt.caseId}".`);
      }
    });
  }

  // 8. Financial Transactions
  const txList = dataset.financialTransactions as Record<string, unknown>[];
  if (Array.isArray(txList)) {
    counts.financialTransactions = txList.length;
    txList.forEach((tx) => {
      registerId(String(tx.transactionId || ''), 'FINANCIAL_TRANSACTIONS');
    });
  }

  // 9. Vehicle Sightings
  const vsList = dataset.vehicleSightings as Record<string, unknown>[];
  if (Array.isArray(vsList)) {
    counts.vehicleSightings = vsList.length;
  }

  // 10. Communications
  const commList = dataset.communications as Record<string, unknown>[];
  if (Array.isArray(commList)) {
    counts.communications = commList.length;
  }

  // 11. Entity Resolution Candidates
  const resList = dataset.resolutionCandidates as Record<string, unknown>[];
  if (Array.isArray(resList)) {
    counts.resolutionCandidates = resList.length;
    resList.forEach((res) => {
      const candidateId = String(res.candidateId || '');
      registerId(candidateId, 'ENTITY_RESOLUTION');
      if (res.entityAId && !entityIds.has(String(res.entityAId))) {
        errors.push(`[ENTITY_RESOLUTION] Candidate ${candidateId} references unknown entityAId "${res.entityAId}".`);
      }
      if (res.entityBId && !entityIds.has(String(res.entityBId))) {
        errors.push(`[ENTITY_RESOLUTION] Candidate ${candidateId} references unknown entityBId "${res.entityBId}".`);
      }
    });
  }

  // 12. AI Findings
  const aiList = dataset.aiFindings as Record<string, unknown>[];
  if (Array.isArray(aiList)) {
    counts.aiFindings = aiList.length;
    aiList.forEach((ai) => {
      const findingId = String(ai.findingId || '');
      registerId(findingId, 'AI_FINDINGS');
      if (Array.isArray(ai.supportingEvidenceIds)) {
        ai.supportingEvidenceIds.forEach((evid: unknown) => {
          if (!evidenceIds.has(String(evid))) {
            errors.push(`[AI_FINDINGS] Finding ${findingId} references unknown supportingEvidenceId "${evid}".`);
          }
        });
      }
    });
  }

  // 13. Reports
  const repList = dataset.reports as Record<string, unknown>[];
  if (Array.isArray(repList)) {
    counts.reports = repList.length;
  }

  // 14. Audit Logs
  const auditList = dataset.auditLogs as Record<string, unknown>[];
  if (Array.isArray(auditList)) {
    counts.auditLogs = auditList.length;
  }

  // 15. Notifications
  const notifList = dataset.notifications as Record<string, unknown>[];
  if (Array.isArray(notifList)) {
    counts.notifications = notifList.length;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts,
  };
}
