"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, QrCode, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { QRCodeSVG } from "qrcode.react";

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

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const { toast } = useToast();
  const { contract, address, isConnected } = useWeb3();

  useEffect(() => {
    async function loadEvent() {
      if (!contract) return;

      try {
        const [
          name,
          date,
          maxParticipants,
          registeredCount,
          checkedInCount,
          organizer,
          rewardAmount,
          isActive
        ] = await contract.getEventDetails(params.id);

        if (!isActive) {
          toast({
            title: "Event Not Found",
            description: "This event does not exist or has been cancelled.",
            variant: "destructive",
          });
          return;
        }

        setEvent({
          id: Number(params.id),
          name,
          date: new Date(Number(date) * 1000),
          maxParticipants: Number(maxParticipants),
          registeredCount: Number(registeredCount),
          rewardAmount,
          organizer,
          location: "On-chain Event", // In a real app, you'd store this in a separate database
        });

        if (address) {
          const isRegistered = await contract.isParticipantRegistered(params.id, address);
          setRegistered(isRegistered);
        }
      } catch (error) {
        console.error("Failed to load event:", error);
        toast({
          title: "Error",
          description: "Failed to load event details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [contract, params.id, address, toast]);

  const handleRegister = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to register for the event.",
        variant: "destructive",
      });
      return;
    }

    setRegistering(true);
    try {
      const tx = await contract!.registerForEvent(params.id);
      await tx.wait();
      
      setRegistered(true);
      toast({
        title: "Registration Successful",
        description: "You have successfully registered for the event!",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for the event. Please try again.",
        variant: "destructive",
      });
    }
    setRegistering(false);
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  const qrValue = JSON.stringify({
    eventId: event.id,
    address,
    timestamp: Date.now(),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{event.name}</CardTitle>
                <CardDescription>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(event.date, "PPP")}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{format(event.date, "p")}</span>
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Location</h3>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Rewards</h3>
                    <div className="flex items-start space-x-4">
                      <Trophy className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p>First Check-in: {ethers.formatEther(event.rewardAmount * 50n / 100n)} ETH</p>
                        <p>Second Check-in: {ethers.formatEther(event.rewardAmount * 30n / 100n)} ETH</p>
                        <p>Third Check-in: {ethers.formatEther(event.rewardAmount * 20n / 100n)} ETH</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Organizer</h3>
                    <p className="text-muted-foreground font-mono">{event.organizer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
                <CardDescription>
                  <div className="flex items-center mt-2">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{event.registeredCount} / {event.maxParticipants} registered</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registered ? (
                  <div className="space-y-4">
                    <div className="text-center p-4">
                      <QRCodeSVG
                        value={qrValue}
                        size={256}
                        className="mx-auto mb-4"
                        level="H"
                      />
                      <p className="text-sm text-muted-foreground">
                        Show this QR code at the event to check in
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `event-${event.id}-qr.png`;
                        link.href = document.querySelector('svg')?.outerHTML
                          ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(document.querySelector('svg')!.outerHTML)}`
                          : '';
                        link.click();
                      }}
                    >
                      Download QR Code
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? "Registering..." : "Register for Event"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}