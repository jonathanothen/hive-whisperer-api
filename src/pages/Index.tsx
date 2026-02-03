import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Thermometer, Bell, BarChart3, Smartphone } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold">
            🐝 BeeHivez
          </Link>
          <div className="flex gap-2">
            {loading ? null : user ? (
              <Button asChild>
                <Link to="/dashboard">Till dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Logga in</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Kom igång</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Övervaka dina bikupor
            <br />
            <span className="text-primary">i realtid</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            BeeHivez låter dig hålla koll på temperatur, luftfuktighet, vikt och ljud
            från dina bikupor – var du än är. Få SMS-varningar vid svärmrisk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">
                Kom igång gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Allt du behöver för att övervaka dina bin
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Thermometer className="h-8 w-8" />}
              title="Realtidsdata"
              description="Se temperatur, luftfuktighet, vikt och ljudnivå live från dina sensorer"
            />
            <FeatureCard
              icon={<Bell className="h-8 w-8" />}
              title="Svärmvarningar"
              description="Automatisk detektion av svärmrisk med direkta SMS-notifieringar"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Historik & Analys"
              description="Följ trender över tid och exportera data för djupare analys"
            />
            <FeatureCard
              icon={<Smartphone className="h-8 w-8" />}
              title="Åtkomst överallt"
              description="Responsiv design fungerar på mobil, surfplatta och dator"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Redo att börja?</h2>
          <p className="text-muted-foreground mb-8">
            Skapa ett konto och börja övervaka dina bikupor på några minuter
          </p>
          <Button size="lg" asChild>
            <Link to="/auth">Skapa konto</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 BeeHivez. Byggd med ❤️ för biodlare.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
