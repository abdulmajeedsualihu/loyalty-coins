"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function CheckInPage({ params }: { params: { id: string } }) {
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();
  const { contract } = useWeb3();
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const router = useRouter();

  useEffect(() => {
    const container = document.getElementById("qr-reader-container");
    if (!container) {
      console.error("QR reader container not found");
      return;
    }

    console.log("Initializing QR Scanner...");
    const qrScanner = new Html5Qrcode("qr-reader-container");
    setHtml5QrCode(qrScanner);

    return () => {
      if (qrScanner.isScanning) {
        qrScanner.stop().then(() => setScanning(false));
      }
      qrScanner.clear();
    };
  }, []);

  const startScan = async () => {
    if (!html5QrCode || scanning) return;

    try {
      setScanning(true);
      console.log("Starting QR scan...");

      const config = { fps: 10, qrbox: { width: 350, height: 350 } };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          console.log("QR Code Scanned:", decodedText);
          try {
            const data = JSON.parse(decodedText);
            console.log("Parsed QR Data:", data);

            if (!data.eventId || !data.address) {
              throw new Error("Invalid QR code data.");
            }

            console.log("Sending transaction to contract...");
            const tx = await contract!.checkIn(data.eventId, data.address);
            await tx.wait();

            console.log("Transaction successful");
            toast({
              title: "Check-in Successful",
              description: "Participant has been checked in.",
            });

            router.push(`/event/${params.id}`);
          } catch (error: any) {
            console.error("QR Data Processing Error:", error);
            toast({
              title: "Invalid QR Code",
              description: error.message || "Could not read QR code.",
              variant: "destructive",
            });
          }
        },
        (errorMessage) => {
          console.warn("QR scan error:", errorMessage);
        }
      );
    } catch (error: any) {
      console.error("QR Scanner Start Error:", error);
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in participant.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (html5QrCode?.isScanning) {
      console.log("Stopping QR scan...");
      html5QrCode.stop().then(() => setScanning(false));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <QrCode className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Kawoho</span>
            </div>
          </Link>
          <nav className="space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/create">Create Event</Link>
            </Button>
          </nav>
        </div>
      </header>
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
              <div
                id="qr-reader-container"
                className="aspect-square relative overflow-hidden rounded-lg"
              ></div>
              <Button size="lg" onClick={startScan} disabled={scanning}>
                {scanning ? "Scanning..." : "Start Scan"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={stopScanning}
                disabled={!scanning}
              >
                Stop Scan
              </Button>
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
