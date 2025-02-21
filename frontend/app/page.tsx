"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, QrCode, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <QrCode className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Kawoho</span>
          </div>
          <nav className="space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/create">Create Event</Link>
            </Button>
            <ConnectButton />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Reward Early Birds at Your Events
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create events, reward punctual attendees, and manage everything on-chain.
            First three check-ins get rewarded automatically!
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/create">Create an Event</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Create Events</CardTitle>
              <CardDescription>
                Set up your event with custom rewards for early check-ins
              </CardDescription>
            </CardHeader>
            <CardContent>
              Create events with details, set maximum participants, and define reward pools for early birds.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Register & Attend</CardTitle>
              <CardDescription>
                Register for events and check in using QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              Browse upcoming events, secure your spot, and check in easily with our QR system.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Earn Rewards</CardTitle>
              <CardDescription>
                Be among the first three to check in and earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              Automatic reward distribution for the first three attendees who check in.
            </CardContent>
          </Card>
        </section>

        <section className="text-center bg-muted rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to revolutionize your events?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join the future of event management with blockchain technology.
          </p>
          <ConnectButton />
        </section>
      </main>

      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <QrCode className="h-6 w-6 text-primary" />
              <span className="font-semibold">Kawoho</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Kawoho. All rights reserved.
            </p>
            <p>Designed by QlickByte</p>
          </div>
        </div>
      </footer>
    </div>
  );
}