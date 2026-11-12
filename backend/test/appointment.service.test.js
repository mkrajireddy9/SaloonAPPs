const test = require("node:test");
const assert = require("node:assert/strict");
const {
  AppointmentService,
} = require("../dist/appointments/appointment.service.js");
const { UserRole } = require("../dist/auth/user.entity.js");

test("guest cannot cancel another customer appointment", async () => {
  const repo = { findOne: async () => null };
  const service = new AppointmentService(repo, {}, {}, {});
  await assert.rejects(
    () =>
      service.cancel("appointment-1", {
        id: "guest-1",
        email: "guest@example.com",
        role: UserRole.USER,
      }),
    /Appointment not found/,
  );
});

test("salon admin cannot create an appointment for another salon", async () => {
  const service = new AppointmentService(
    {},
    {},
    {},
    {},
  );
  await assert.rejects(
    () =>
      service.create(
        {
          salonId: "salon-b",
          service: "Signature cut",
          date: "2099-01-01",
          time: "10:00 AM",
        },
        {
          email: "admin@example.com",
          name: "Admin",
          role: UserRole.ADMIN,
          salonId: "salon-a",
        },
      ),
    /only create appointments for their own salon/,
  );
});
