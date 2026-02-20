-- CreateTable
CREATE TABLE "LeadSource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FundingType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductOffering" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "technologyGroup" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AssessmentPath" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "requiresSurvey" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkOrderType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StatusMaster" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContactMethod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContactRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConsentStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LeadChannel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PropertyType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TenureType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EvidenceCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'Customer',
    "phone" TEXT,
    "email" TEXT,
    "billingAddressLine1" TEXT,
    "billingAddressLine2" TEXT,
    "billingCity" TEXT,
    "billingPostcode" TEXT,
    "billingCountry" TEXT,
    "preferredContactMethodId" INTEGER,
    "customerFundingTypeId" INTEGER,
    "marketingSourceId" INTEGER,
    "primaryContactId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_preferredContactMethodId_fkey" FOREIGN KEY ("preferredContactMethodId") REFERENCES "ContactMethod" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_customerFundingTypeId_fkey" FOREIGN KEY ("customerFundingTypeId") REFERENCES "FundingType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_marketingSourceId_fkey" FOREIGN KEY ("marketingSourceId") REFERENCES "LeadSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "accountId" INTEGER,
    "roleId" INTEGER,
    "preferredContactMethodId" INTEGER,
    "consentStatusId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contact_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ContactRole" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contact_preferredContactMethodId_fkey" FOREIGN KEY ("preferredContactMethodId") REFERENCES "ContactMethod" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contact_consentStatusId_fkey" FOREIGN KEY ("consentStatusId") REFERENCES "ConsentStatus" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT,
    "companyName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "sourceId" INTEGER,
    "campaignId" INTEGER,
    "createdFromId" INTEGER,
    "duplicateOfLeadId" INTEGER,
    "duplicateStatus" TEXT DEFAULT 'Unique',
    "fundingTypeId" INTEGER,
    "interestedProductId" INTEGER,
    "propertyAddressLine1" TEXT,
    "propertyAddressLine2" TEXT,
    "propertyCity" TEXT,
    "propertyPostcode" TEXT,
    "propertyCountry" TEXT,
    "qualificationStatus" TEXT DEFAULT 'New',
    "disqualificationReason" TEXT,
    "notes" TEXT,
    "qualifiedAccountId" INTEGER,
    "qualifiedContactId" INTEGER,
    "qualifiedPropertyId" INTEGER,
    "qualifiedOpportunityId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LeadSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_createdFromId_fkey" FOREIGN KEY ("createdFromId") REFERENCES "LeadChannel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_duplicateOfLeadId_fkey" FOREIGN KEY ("duplicateOfLeadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_fundingTypeId_fkey" FOREIGN KEY ("fundingTypeId") REFERENCES "FundingType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_interestedProductId_fkey" FOREIGN KEY ("interestedProductId") REFERENCES "ProductOffering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_qualifiedAccountId_fkey" FOREIGN KEY ("qualifiedAccountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_qualifiedContactId_fkey" FOREIGN KEY ("qualifiedContactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_qualifiedPropertyId_fkey" FOREIGN KEY ("qualifiedPropertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_qualifiedOpportunityId_fkey" FOREIGN KEY ("qualifiedOpportunityId") REFERENCES "Opportunity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Property" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyName" TEXT NOT NULL,
    "accountId" INTEGER NOT NULL,
    "primaryContactId" INTEGER,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "propertyTypeId" INTEGER,
    "tenureTypeId" INTEGER,
    "accessNotes" TEXT,
    "parkingNotes" TEXT,
    "surveyRequiredDefault" BOOLEAN NOT NULL DEFAULT false,
    "utilitiesNotes" TEXT,
    "createdFromLeadId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Property_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_propertyTypeId_fkey" FOREIGN KEY ("propertyTypeId") REFERENCES "PropertyType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_tenureTypeId_fkey" FOREIGN KEY ("tenureTypeId") REFERENCES "TenureType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_createdFromLeadId_fkey" FOREIGN KEY ("createdFromLeadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "opportunityName" TEXT NOT NULL,
    "accountId" INTEGER NOT NULL,
    "primaryContactId" INTEGER,
    "propertyId" INTEGER NOT NULL,
    "fundingTypeId" INTEGER,
    "productOfferingId" INTEGER,
    "assessmentPathId" INTEGER,
    "requiresSurvey" BOOLEAN NOT NULL DEFAULT false,
    "salesStage" TEXT DEFAULT 'New',
    "targetInstallWindowStart" DATETIME,
    "targetInstallWindowEnd" DATETIME,
    "estimatedValue" REAL,
    "quoteStatus" TEXT DEFAULT 'Draft',
    "acceptanceDate" DATETIME,
    "deliveryStatus" TEXT DEFAULT 'Not Started',
    "evidenceStatus" TEXT DEFAULT 'Not Required',
    "qaStatus" TEXT DEFAULT 'Not Started',
    "paymentLinkSent" BOOLEAN NOT NULL DEFAULT false,
    "paymentLinkSentOn" DATETIME,
    "paymentRequested" BOOLEAN NOT NULL DEFAULT false,
    "paymentRequestedOn" DATETIME,
    "xeroInvoiceStatus" TEXT DEFAULT 'Not Synced',
    "xeroInvoiceNumber" TEXT,
    "xeroInvoiceId" TEXT,
    "closeBlockedReason" TEXT,
    "actualCloseDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Opportunity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Opportunity_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Opportunity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Opportunity_fundingTypeId_fkey" FOREIGN KEY ("fundingTypeId") REFERENCES "FundingType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Opportunity_productOfferingId_fkey" FOREIGN KEY ("productOfferingId") REFERENCES "ProductOffering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Opportunity_assessmentPathId_fkey" FOREIGN KEY ("assessmentPathId") REFERENCES "AssessmentPath" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpportunityTimeline" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "opportunityId" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpportunityTimeline_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteName" TEXT NOT NULL,
    "quoteNumber" TEXT,
    "opportunityId" INTEGER NOT NULL,
    "propertyId" INTEGER,
    "quoteType" TEXT DEFAULT 'Initial',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "sentOn" DATETIME,
    "acceptedOn" DATETIME,
    "acceptanceMethod" TEXT,
    "customerProof" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quote_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "lineTotal" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workOrderNumber" TEXT,
    "opportunityId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "workOrderTypeId" INTEGER NOT NULL,
    "fundingTypeId" INTEGER,
    "evidenceRequired" BOOLEAN NOT NULL DEFAULT false,
    "evidenceGateStatus" TEXT NOT NULL DEFAULT 'Not Required',
    "qaGateStatus" TEXT NOT NULL DEFAULT 'Not Required',
    "completionBlockedReason" TEXT,
    "scheduledStart" DATETIME,
    "scheduledEnd" DATETIME,
    "actualStart" DATETIME,
    "actualEnd" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Not Started',
    "substatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrder_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_workOrderTypeId_fkey" FOREIGN KEY ("workOrderTypeId") REFERENCES "WorkOrderType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_fundingTypeId_fkey" FOREIGN KEY ("fundingTypeId") REFERENCES "FundingType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workOrderId" INTEGER NOT NULL,
    "resourceName" TEXT NOT NULL,
    "resourceType" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "bookingStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvidenceRequirement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "productOfferingId" INTEGER,
    "workOrderTypeId" INTEGER,
    "fundingTypeId" INTEGER,
    "evidenceCategoryId" INTEGER,
    "requiredCount" INTEGER NOT NULL DEFAULT 1,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EvidenceRequirement_productOfferingId_fkey" FOREIGN KEY ("productOfferingId") REFERENCES "ProductOffering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EvidenceRequirement_workOrderTypeId_fkey" FOREIGN KEY ("workOrderTypeId") REFERENCES "WorkOrderType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EvidenceRequirement_fundingTypeId_fkey" FOREIGN KEY ("fundingTypeId") REFERENCES "FundingType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EvidenceRequirement_evidenceCategoryId_fkey" FOREIGN KEY ("evidenceCategoryId") REFERENCES "EvidenceCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "opportunityId" INTEGER,
    "workOrderId" INTEGER,
    "propertyId" INTEGER,
    "requirementId" INTEGER,
    "evidenceTypeId" INTEGER,
    "filePath" TEXT,
    "capturedBy" TEXT,
    "capturedOn" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reviewer" TEXT,
    "reviewedOn" DATETIME,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EvidenceItem_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceItem_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceItem_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "EvidenceRequirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EvidenceItem_evidenceTypeId_fkey" FOREIGN KEY ("evidenceTypeId") REFERENCES "EvidenceCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QAChecklist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "productOfferingId" INTEGER,
    "workOrderTypeId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QAChecklist_productOfferingId_fkey" FOREIGN KEY ("productOfferingId") REFERENCES "ProductOffering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QAChecklist_workOrderTypeId_fkey" FOREIGN KEY ("workOrderTypeId") REFERENCES "WorkOrderType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QAChecklistItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "checklistId" INTEGER NOT NULL,
    "itemText" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QAChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "QAChecklist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QAResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "opportunityId" INTEGER,
    "workOrderId" INTEGER,
    "checklistItemId" INTEGER NOT NULL,
    "result" TEXT DEFAULT 'N/A',
    "notes" TEXT,
    "checkedBy" TEXT,
    "checkedOn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QAResult_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QAResult_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QAResult_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "QAChecklistItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "opportunityId" INTEGER NOT NULL,
    "propertyId" INTEGER,
    "amountRequested" REAL NOT NULL,
    "paymentLinkUrl" TEXT,
    "paymentLinkSentOn" DATETIME,
    "sentBy" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Not Sent',
    "paidOn" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentRequest_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "XeroInvoiceLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "opportunityId" INTEGER NOT NULL,
    "xeroInvoiceId" TEXT,
    "xeroInvoiceNumber" TEXT,
    "xeroStatus" TEXT,
    "total" REAL,
    "lastSyncedOn" DATETIME,
    "syncError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "XeroInvoiceLink_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Case" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "caseType" TEXT DEFAULT 'Complaint',
    "accountId" INTEGER NOT NULL,
    "contactId" INTEGER,
    "propertyId" INTEGER NOT NULL,
    "relatedOpportunityId" INTEGER NOT NULL,
    "priority" TEXT,
    "slaDueDate" DATETIME,
    "rootCause" TEXT,
    "resolutionType" TEXT,
    "outcomeNotes" TEXT,
    "requiresSiteVisit" BOOLEAN NOT NULL DEFAULT false,
    "remedialWorkOrderId" INTEGER,
    "status" TEXT DEFAULT 'Open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Case_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Case_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_relatedOpportunityId_fkey" FOREIGN KEY ("relatedOpportunityId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Case_remedialWorkOrderId_fkey" FOREIGN KEY ("remedialWorkOrderId") REFERENCES "WorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadSource_name_key" ON "LeadSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FundingType_name_key" ON "FundingType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOffering_name_key" ON "ProductOffering"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentPath_name_key" ON "AssessmentPath"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderType_name_key" ON "WorkOrderType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StatusMaster_category_key_key" ON "StatusMaster"("category", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ContactMethod_name_key" ON "ContactMethod"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ContactRole_name_key" ON "ContactRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentStatus_name_key" ON "ConsentStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_name_key" ON "Campaign"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LeadChannel_name_key" ON "LeadChannel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyType_name_key" ON "PropertyType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TenureType_name_key" ON "TenureType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceCategory_name_key" ON "EvidenceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Account_primaryContactId_key" ON "Account"("primaryContactId");

-- CreateIndex
CREATE UNIQUE INDEX "XeroInvoiceLink_opportunityId_key" ON "XeroInvoiceLink"("opportunityId");

