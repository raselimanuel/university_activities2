import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/app/actions/user";
import { getEventDetail } from "@/app/actions/activities";
import { db } from "@/db";
import { eventUser } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import ActivityDetailClient from "./ActivityDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const session = await getCurrentUser();

  if (!session || !session.auth || !session.profile) {
    redirect("/login");
  }

  const { id } = await params;
  const eventId = parseInt(id);

  if (isNaN(eventId)) {
    notFound();
  }

  const { profile } = session;
  const detailResultPromise = getEventDetail(eventId);

  const regPromise = profile.role === "student"
    ? db
        .select()
        .from(eventUser)
        .where(
          and(
            eq(eventUser.userId, profile.id),
            eq(eventUser.eventId, eventId)
          )
        )
        .limit(1)
        .catch(() => null)
    : Promise.resolve(null);

  const [detailResult, reg] = await Promise.all([
    detailResultPromise,
    regPromise,
  ]);

  if (!detailResult.success || !detailResult.data) {
    notFound();
  }

  const { event, organizer, creatorName } = detailResult.data;

  // Check if student has already registered for this event
  let registrationStatus: "not_registered" | "pending" | "approved" | "rejected" = "not_registered";

  if (reg && reg.length > 0) {
    registrationStatus = reg[0].status as any;
  }

  return (
    <ActivityDetailClient
      event={event}
      organizer={organizer}
      creatorName={creatorName}
      user={{
        id: profile.id,
        name: profile.name,
        role: profile.role,
      }}
      registrationStatus={registrationStatus}
    />
  );
}
