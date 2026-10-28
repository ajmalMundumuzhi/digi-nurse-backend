const crypto = require("crypto");
const mongoose = require("mongoose");
const NursingCarePlan = require("../../models/NursingCarePlan");
const Encounter = require("../../models/Encounter");
const asyncHandler = require("../../utils/asyncHandler");

require("../../models/Patient");
require("../../models/User");
require("../../models/DoctorOrder");
require("../../models/NursingRecord");

const createItemId = (prefix) =>
  `${prefix}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

const isValidId = (id) => mongoose.isValidObjectId(id);

const findPlan = (planId, institutionId) =>
  NursingCarePlan.findOne({
    _id: planId,
    institutionId
  });

const addRevision = (plan, userId, changeReason) => {
  plan.revisionHistory.push({
    planVersion: plan.version,
    changedBy: userId,
    changedAt: new Date(),
    changeReason: changeReason || "Care plan updated",
    previousVersionReference: `Version ${plan.version}`
  });

  plan.version += 1;
};

const createCarePlan = asyncHandler(async (req, res) => {
  const encounter = await Encounter.findOne({
    _id: req.body.encounterId,
    institutionId: req.user.institutionId,
    status: "active"
  });

  if (!encounter) {
    return res.status(404).json({
      success: false,
      message: "Active encounter not found for this institution"
    });
  }

  const plan = await NursingCarePlan.create({
    institutionId: req.user.institutionId,
    patientId: encounter.patientId,
    encounterId: encounter._id,
    planNumber: `NCP-${Date.now()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`,
    title: req.body.title.trim(),
    priority: req.body.priority || "medium",
    status: "draft",
    createdBy: req.user._id
  });

  return res.status(201).json({
    success: true,
    message: "Care plan created as draft",
    data: plan
  });
});

const getCarePlans = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || 10, 1),
    100
  );

  const filter = {
    institutionId: req.user.institutionId
  };

  if (req.query.encounterId) {
    if (!isValidId(req.query.encounterId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid encounterId"
      });
    }

    filter.encounterId = req.query.encounterId;
  }

  if (req.query.patientId) {
    if (!isValidId(req.query.patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patientId"
      });
    }

    filter.patientId = req.query.patientId;
  }

  if (req.query.status) {
    const allowedStatuses = [
      "draft",
      "active",
      "on_hold",
      "completed",
      "discontinued"
    ];

    if (!allowedStatuses.includes(req.query.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid care plan status"
      });
    }

    filter.status = req.query.status;
  }

  const [plans, total] = await Promise.all([
    NursingCarePlan.find(filter)
      .populate("patientId", "patientNumber firstName lastName")
      .populate("encounterId", "encounterNumber status")
      .populate("createdBy", "staffId firstName lastName role")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    NursingCarePlan.countDocuments(filter)
  ]);

  return res.status(200).json({
    success: true,
    data: plans,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

const getCarePlanById = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid care plan ID"
    });
  }

  const plan = await findPlan(req.params.id, req.user.institutionId)
    .populate("patientId", "patientNumber firstName lastName")
    .populate("encounterId", "encounterNumber status")
    .populate("createdBy", "staffId firstName lastName role")
    .populate("reviewedBy", "staffId firstName lastName role")
    .populate("problems.identifiedBy", "staffId firstName lastName role")
    .populate("problems.evaluation.evaluatedBy", "staffId firstName lastName role")
    .populate("problems.interventions.assignedTo", "staffId firstName lastName role")
    .populate("problems.interventions.completedBy", "staffId firstName lastName role")
    .populate("problems.interventions.relatedOrderId", "orderNumber title status")
    .populate("problems.interventions.relatedNursingRecordId", "recordType recordedAt")
    .populate("revisionHistory.changedBy", "staffId firstName lastName role");

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Care plan not found"
    });
  }

  return res.status(200).json({
    success: true,
    data: plan
  });
});

const updateCarePlan = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid care plan ID"
    });
  }

  const plan = await findPlan(req.params.id, req.user.institutionId);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Care plan not found"
    });
  }

  if (plan.status !== "draft" && plan.status !== "active") {
    return res.status(409).json({
      success: false,
      message: "Only draft or active care plans can be edited"
    });
  }

  addRevision(plan, req.user._id, req.body.changeReason);

  if (req.body.title !== undefined) {
    plan.title = req.body.title.trim();
  }

  if (req.body.priority !== undefined) {
    plan.priority = req.body.priority;
  }

  await plan.save();

  return res.status(200).json({
    success: true,
    message: "Care plan updated",
    data: plan
  });
});

const changeCarePlanStatus = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid care plan ID"
    });
  }

  const plan = await findPlan(req.params.id, req.user.institutionId);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Care plan not found"
    });
  }

  const currentStatus = plan.status;
  const nextStatus = req.body.status;

  const transitions = {
    draft: ["active", "discontinued"],
    active: ["on_hold", "completed", "discontinued"],
    on_hold: ["active", "discontinued"],
    completed: [],
    discontinued: []
  };

  if (!transitions[currentStatus]?.includes(nextStatus)) {
    return res.status(409).json({
      success: false,
      message: `Cannot change care plan status from ${currentStatus} to ${nextStatus}`
    });
  }

  addRevision(plan, req.user._id, req.body.changeReason);

  plan.status = nextStatus;

  if (nextStatus === "active") {
    plan.activatedAt = new Date();
    plan.reviewedBy = req.user._id;
    plan.reviewedAt = new Date();
  }

  await plan.save();

  return res.status(200).json({
    success: true,
    message: "Care plan status updated",
    data: plan
  });
});

const addProblem = asyncHandler(async (req, res) => {
  const plan = await findPlan(req.params.id, req.user.institutionId);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Care plan not found"
    });
  }

  if (!["draft", "active"].includes(plan.status)) {
    return res.status(409).json({
      success: false,
      message: "Problems can only be added to draft or active care plans"
    });
  }

  const problem = {
    problemId: createItemId("PRB"),
    diagnosisCode: req.body.diagnosisCode,
    diagnosisName: req.body.diagnosisName.trim(),
    description: req.body.description,
    supportingEvidence: req.body.supportingEvidence || [],
    riskFactors: req.body.riskFactors || [],
    priority: req.body.priority || "medium",
    identifiedAt: new Date(),
    identifiedBy: req.user._id
  };

  addRevision(plan, req.user._id, req.body.changeReason);
  plan.problems.push(problem);
  await plan.save();

  return res.status(201).json({
    success: true,
    message: "Care problem added",
    data: plan.problems[plan.problems.length - 1]
  });
});

const addGoal = asyncHandler(async (req, res) => {
  const plan = await findPlan(req.params.id, req.user.institutionId);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Care plan not found"
    });
  }

  if (!["draft", "active"].includes(plan.status)) {
    return res.status(409).json({
      success: false,
      message: "Goals can only be added to draft or active care plans"
    });
  }

  const problem = plan.problems.find(
    (item) => item.problemId === req.params.problemId
  );

  if (!problem) {
    return res.status(404).json({
      success: false,
      message: "Care problem not found"
    });
  }

  const goal = {
    goalId: createItemId("GL"),
    description: req.body.description.trim(),
    baselineValue: req.body.baselineValue ?? null,
    baselineUnit: req.body.baselineUnit,
    targetValue: req.body.targetValue ?? null,
    targetUnit: req.body.targetUnit,
    successCriteria: req.body.successCriteria,
    targetDate: req.body.targetDate
  };

  addRevision(plan, req.user._id, req.body.changeReason);
  problem.goals.push(goal);
  await plan.save();

  return res.status(201).json({
    success: true,
    message: "Goal added",
    data: problem.goals[problem.goals.length - 1]
  });
});

const addIntervention = asyncHandler(async (req, res) => {
  const plan = await findPlan(req.params.id, req.user.institutionId);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Care plan not found"
    });
  }

  if (!["draft", "active"].includes(plan.status)) {
    return res.status(409).json({
      success: false,
      message: "Interventions can only be added to draft or active care plans"
    });
  }

  const problem = plan.problems.find(
    (item) => item.problemId === req.params.problemId
  );

  if (!problem) {
    return res.status(404).json({
      success: false,
      message: "Care problem not found"
    });
  }

  if (
    req.body.linkedGoalId &&
    !problem.goals.some((goal) => goal.goalId === req.body.linkedGoalId)
  ) {
    return res.status(400).json({
      success: false,
      message: "linkedGoalId must refer to a goal in this care problem"
    });
  }

  const intervention = {
    interventionId: createItemId("INT"),
    description: req.body.description.trim(),
    interventionType: req.body.interventionType,
    linkedGoalId: req.body.linkedGoalId || null,
    frequency: req.body.frequency,
    scheduledTimes: req.body.scheduledTimes || [],
    assignedTo: req.body.assignedTo || null,
    relatedOrderId: req.body.relatedOrderId || null,
    relatedNursingRecordId: req.body.relatedNursingRecordId || null
  };

  addRevision(plan, req.user._id, req.body.changeReason);
  problem.interventions.push(intervention);
  await plan.save();

  return res.status(201).json({
    success: true,
    message: "Intervention added",
    data: problem.interventions[problem.interventions.length - 1]
  });
});

const updateGoal = asyncHandler(async (req, res) => {
  const plan = await findPlan(req.params.id, req.user.institutionId);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Care plan not found"
    });
  }

  if (plan.status !== "active") {
    return res.status(409).json({
      success: false,
      message: "Goals can only be updated on active care plans"
    });
  }

  const problem = plan.problems.find(
    (item) => item.problemId === req.params.problemId
  );

  const goal = problem?.goals.find(
    (item) => item.goalId === req.params.goalId
  );

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: "Care problem or goal not found"
    });
  }

  addRevision(plan, req.user._id, req.body.changeReason);

  const allowedFields = [
    "status",
    "evaluationNotes",
    "baselineValue",
    "baselineUnit",
    "targetValue",
    "targetUnit",
    "successCriteria",
    "targetDate"
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      goal[field] = req.body[field];
    }
  }

  if (req.body.status === "achieved" || req.body.status === "not_achieved") {
    goal.evaluatedAt = new Date();
  }

  plan.lastEvaluatedAt = new Date();
  await plan.save();

  return res.status(200).json({
    success: true,
    message: "Goal updated",
    data: goal
  });
});

const updateIntervention = asyncHandler(async (req, res) => {
  const plan = await findPlan(req.params.id, req.user.institutionId);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Care plan not found"
    });
  }

  if (plan.status !== "active") {
    return res.status(409).json({
      success: false,
      message: "Interventions can only be updated on active care plans"
    });
  }

  const problem = plan.problems.find(
    (item) => item.problemId === req.params.problemId
  );

  const intervention = problem?.interventions.find(
    (item) => item.interventionId === req.params.interventionId
  );

  if (!intervention) {
    return res.status(404).json({
      success: false,
      message: "Care problem or intervention not found"
    });
  }

  addRevision(plan, req.user._id, req.body.changeReason);

  const allowedFields = [
    "status",
    "patientResponse",
    "exceptionReason",
    "frequency",
    "scheduledTimes"
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      intervention[field] = req.body[field];
    }
  }

  if (req.body.status === "completed") {
    intervention.completedAt = new Date();
    intervention.completedBy = req.user._id;
  }

  await plan.save();

  return res.status(200).json({
    success: true,
    message: "Intervention updated",
    data: intervention
  });
});

const evaluateProblem = asyncHandler(async (req, res) => {
  const plan = await findPlan(req.params.id, req.user.institutionId);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Care plan not found"
    });
  }

  if (plan.status !== "active") {
    return res.status(409).json({
      success: false,
      message: "Only active care plans can be evaluated"
    });
  }

  const problem = plan.problems.find(
    (item) => item.problemId === req.params.problemId
  );

  if (!problem) {
    return res.status(404).json({
      success: false,
      message: "Care problem not found"
    });
  }

  addRevision(plan, req.user._id, req.body.changeReason);

  problem.evaluation = {
    outcome: req.body.outcome || "not_evaluated",
    findings: req.body.findings,
    goalProgress: req.body.goalProgress,
    recommendedReview: req.body.recommendedReview ?? false,
    evaluatedBy: req.user._id,
    evaluatedAt: new Date()
  };

  if (problem.evaluation.outcome === "resolved") {
    problem.status = "resolved";
  }

  plan.lastEvaluatedAt = new Date();
  await plan.save();

  return res.status(200).json({
    success: true,
    message: "Care problem evaluation saved",
    data: problem
  });
});

module.exports = {
  createCarePlan,
  getCarePlans,
  getCarePlanById,
  updateCarePlan,
  changeCarePlanStatus,
  addProblem,
  addGoal,
  addIntervention,
  updateGoal,
  updateIntervention,
  evaluateProblem
};