import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { BookingsDatabase } from './service.js';
import { createBookingsService } from './service.js';
import { bookingParamsSchema, createBookingSchema, ownerBookingStatusSchema } from './schemas.js';

export function createBookingsRoutes(prisma: BookingsDatabase, authenticate: RequestHandler) {
  const router = Router();
  const service = createBookingsService(prisma);

  router.get('/my-rentals', authenticate, async (_req, res) => {
    res.json({ bookings: await service.listRentals(res.locals.currentUser.id) });
  });
  router.get('/incoming', authenticate, async (_req, res) => {
    res.json({ bookings: await service.listIncoming(res.locals.currentUser.id) });
  });

  router.post('/', authenticate, async (req, res) => {
    const booking = await service.create(
      res.locals.currentUser.id,
      createBookingSchema.parse(req.body),
    );
    res.status(201).json({ booking });
  });
  router.patch('/:id/status', authenticate, async (req, res) => {
    const { id } = bookingParamsSchema.parse(req.params);
    res.json({
      booking: await service.updateOwnerStatus(
        res.locals.currentUser.id,
        id,
        ownerBookingStatusSchema.parse(req.body).status,
      ),
    });
  });
  return router;
}
