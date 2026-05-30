import type { Metadata } from "next";
import { scheduleService } from "@/utils/schedule";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const schedule = await scheduleService.scheduleDetail(id, undefined);
    if (!schedule) {
      return {
        title: "Schedule | BLAX",
      };
    }
    return {
      title: `${schedule.name} | BLAX`,
      description: `${schedule.typeEvent} - ${schedule.venue}, ${schedule.date} ${schedule.time} WIB. ${schedule.openSlots} slots tersedia.`,
      openGraph: {
        title: `${schedule.name} | BLAX`,
        description: `${schedule.typeEvent} - ${schedule.venue}, ${schedule.date} ${schedule.time} WIB. ${schedule.openSlots} slots tersedia.`,
        images: [
          {
            url: schedule.imageUrl,
            width: 1200,
            height: 630,
            alt: schedule.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${schedule.name} | BLAX`,
        description: `${schedule.typeEvent} - ${schedule.venue}, ${schedule.date} ${schedule.time} WIB. ${schedule.openSlots} slots tersedia.`,
        images: [schedule.imageUrl],
      },
    };
  } catch (error) {
    return {
      title: "Schedule | BLAX",
    };
  }
}