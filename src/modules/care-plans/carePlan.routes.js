const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const authorizeRoles = require("../../middleware/role.middleware");

const {
  validateCreateCarePlan,
  validateUpdateCarePlan,
  validateStatusChange,
  validateProblem,
  validateGoal,
  validateIntervention,
  validateGoalUpdate,
  validateInterventionUpdate,
  validateEvaluation
} = require("./carePlan.validation");

const {
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
} = require("./carePlan.controller");

router.use(protect);

router.get(
  "/",
  authorizeRoles("admin", "doctor", "nurse_in_charge", "nurse"),
  getCarePlans
);

router.post(
  "/",
  authorizeRoles("nurse_in_charge", "nurse"),
  validateCreateCarePlan,
  createCarePlan
);

router.get(
  "/:id",
  authorizeRoles("admin", "doctor", "nurse_in_charge", "nurse"),
  getCarePlanById
);

router.patch(
  "/:id",
  authorizeRoles("nurse_in_charge", "nurse"),
  validateUpdateCarePlan,
  updateCarePlan
);

router.patch(
  "/:id/status",
  authorizeRoles("nurse_in_charge", "nurse"),
  validateStatusChange,
  changeCarePlanStatus
);

router.post(
  "/:id/problems",
  authorizeRoles("nurse_in_charge", "nurse"),
  validateProblem,
  addProblem
);

router.post(
  "/:id/problems/:problemId/goals",
  authorizeRoles("nurse_in_charge", "nurse"),
  validateGoal,
  addGoal
);

router.post(
  "/:id/problems/:problemId/interventions",
  authorizeRoles("nurse_in_charge", "nurse"),
  validateIntervention,
  addIntervention
);

router.patch(
  "/:id/problems/:problemId/goals/:goalId",
  authorizeRoles("nurse_in_charge", "nurse"),
  validateGoalUpdate,
  updateGoal
);

router.patch(
  "/:id/problems/:problemId/interventions/:interventionId",
  authorizeRoles("nurse_in_charge", "nurse"),
  validateInterventionUpdate,
  updateIntervention
);

router.patch(
  "/:id/problems/:problemId/evaluation",
  authorizeRoles("nurse_in_charge", "nurse"),
  validateEvaluation,
  evaluateProblem
);

module.exports = router;