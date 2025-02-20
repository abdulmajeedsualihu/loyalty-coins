"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { format } from "date-fns";
import { useWeb3 } from "@/hooks/use-web3";

interface Event {
  id: number;
  name: string;
  date: Date;
  location: string;
  maxParticipants: number;
  registeredCount: number;
  rewardAmount: bigint;
  organizer: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { contract } = useWeb3();

  useEffect(() => {
    async function loadEvents() {
      if (!contract) return;

      try {
        const eventCount = await contract.eventCount();
        const loadedEvents = [];

        for (let i = 0; i < eventCount; i++) {
          const [
            name,
            date,
            maxParticipants,
            registeredCount,
            checkedInCount,
            organizer,
            rewardAmount,
            isActive
          ] = await contract.getEventDetails(i);

          if (isActive) {
            loadedEvents.push({
              id: i,
              name,
              date: new Date(Number(date) * 1000),
              maxParticipants: Number(maxParticipants),
              registeredCount: Number(registeredCount),
              rewardAmount,
              organizer,
              location: "On-chain Event", // In a real app, you'd store this in a separate database
            });
          }
        }

        setEvents(loadedEvents);
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [contract]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Upcoming Events</h1>
          <Button asChild>
            <Link href="/create">Create Event</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <div className="flex items-center text-muted-foreground mt-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{format(event.date, "PPP")}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{format(event.date, "p")}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{event.registeredCount} / {event.maxParticipants} registered</span>
                  </div>
                  <div className="mt-4">
                    <p className="font-medium">Early Bird Rewards</p>
                    <p className="text-muted-foreground">
                      Up to {ethers.formatEther(event.rewardAmount)} ETH for first 3 check-ins
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href={`/event/${event.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}

          {events.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">No events found</p>
              <Button asChild>
                <Link href="/create">Create the First Event</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}