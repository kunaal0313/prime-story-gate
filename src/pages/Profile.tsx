import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { format } from "date-fns";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    username: string;
    date_of_birth: string | null;
    created_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, date_of_birth, created_at")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-3xl font-bold">Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Username</p>
                <p className="text-lg font-medium">{profile?.username}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  Date of Birth
                </p>
                <p className="text-lg font-medium">
                  {profile?.date_of_birth
                    ? format(new Date(profile.date_of_birth), "MMMM dd, yyyy")
                    : "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  Member Since
                </p>
                <p className="text-lg font-medium">
                  {profile?.created_at
                    ? format(new Date(profile.created_at), "MMMM dd, yyyy")
                    : "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
