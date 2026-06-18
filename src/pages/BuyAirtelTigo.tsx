import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NetworkBuyPage from "@/components/data/NetworkBuyPage";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUi";

export default function BuyAirtelTigo() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Buy AirtelTigo Data"
        description="Choose iShare or BigTime bundles for any AirtelTigo number."
      />
      <Tabs defaultValue="ishare" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md h-11 bg-white/5 p-1 rounded-xl">
          <TabsTrigger value="ishare" className="rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">iShare</TabsTrigger>
          <TabsTrigger value="bigtime" className="rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">BigTime</TabsTrigger>
        </TabsList>
        <TabsContent value="ishare">
          <NetworkBuyPage network="airteltigo_ishare" title="" subtitle="" embedded />
        </TabsContent>
        <TabsContent value="bigtime">
          <NetworkBuyPage network="airteltigo_bigtime" title="" subtitle="" embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
