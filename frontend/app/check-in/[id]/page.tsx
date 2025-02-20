"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import QrReader from "react-qr-scanner";
import { useRouter } from "next/navigation";

export default function CheckInPage({ params }: { params: { id: string } }) {
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();
  const { contract, address } = useWeb3();
  const router = useRouter();

  const handleScan = async (data: any) => {
    if (!data || scanning) return;

    try {
      setScanning(true);
      const qrData = JSON.parse(data.text);
      
      if (qrData.eventId !== Number(params.id)) {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is for a different event.",
          variant: "destructive",
        });
        return;
      }

      const tx = await contract!.checkIn(params.id, qrData.address);
      await tx.wait();

      toast({
        title: "Check-in Successful",
        description: "Participant has been checked in!",
      });

      // Redirect back to event page
      router.push(`/event/${params.id}`);
    } catch (error: any) {
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in participant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleError = (error: any) => {
    toast({
      title: "Scanner Error",
      description: "Failed to access camera. Please check permissions.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Event Check-in</CardTitle>
            <CardDescription>
              Scan participant's QR code to check them in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="aspect-square relative overflow-hidden rounded-lg">
                <QrReader
                  delay={300}
                  onError={handleError}
                  onScan={handleScan}
                  style={{ width: "100%" }}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Position the QR code within the frame to scan
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}