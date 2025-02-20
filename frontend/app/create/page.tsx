"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  date: z.date().min(new Date(), "Event date must be in the future"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  maxParticipants: z.number().min(1, "Must allow at least 1 participant"),
  rewardAmount: z.string().refine((val) => {
    try {
      const amount = ethers.parseEther(val);
      return amount > 0;
    } catch {
      return false;
    }
  }, "Invalid ETH amount"),
});

export default function CreateEventPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { contract, isConnected } = useWeb3();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      maxParticipants: 50,
      rewardAmount: "0.1",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create an event.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const tx = await contract!.createEvent(
        values.name,
        Math.floor(values.date.getTime() / 1000),
        values.maxParticipants,
        { value: ethers.parseEther(values.rewardAmount) }
      );
      
      await tx.wait();
      
      toast({
        title: "Event Created",
        description: "Your event has been created successfully!",
      });
      
      router.push("/events");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>
              Set up your event and reward pool for early check-ins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Web3 Developer Meetup" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Event Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Tech Hub Downtown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Participants</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rewardAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward Pool (ETH)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>
                        This amount will be split among the first three check-ins
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Event"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}