import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Briefcase, 
  TrendingUp, 
  Zap, 
  MapPin, 
  Building2,
  DollarSign,
  Code2,
  Users,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Star,
  Target,
  Rocket,
  Award
} from 'lucide-react';

const popularCategories = [
  { 
    icon: Code2, 
    title: 'Software Engineering', 
    count: '12,843',
    trending: true,
    gradient: 'from-blue-500 to-cyan-500',
    query: 'software engineer developer'
  },
  { 
    icon: DollarSign, 
    title: 'Sales & Business', 
    count: '9,421',
    trending: true,
    gradient: 'from-emerald-500 to-green-500',
    query: 'sales manager account executive'
  },
  { 
    icon: Sparkles, 
    title: 'Data Science', 
    count: '6,789',
    trending: false,
    gradient: 'from-purple-500 to-pink-500',
    query: 'data scientist machine learning'
  },
  { 
    icon: Building2, 
    title: 'Product Management', 
    count: '5,234',
    trending: true,
    gradient: 'from-orange-500 to-red-500',
    query: 'product manager'
  },
  { 
    icon: Users, 
    title: 'Marketing', 
    count: '7,912',
    trending: false,
    gradient: 'from-pink-500 to-rose-500',
    query: 'marketing manager digital marketing'
  },
  { 
    icon: Target, 
    title: 'Design & UX', 
    count: '4,567',
    trending: true,
    gradient: 'from-indigo-500 to-purple-500',
    query: 'UX designer UI designer'
  }
];

const topLocations = [
  { name: 'Remote', count: '24,532', hot: true },
  { name: 'San Francisco', count: '8,234', hot: true },
  { name: 'New York', count: '7,891', hot: false },
  { name: 'Austin', count: '5,432', hot: true },
  { name: 'Seattle', count: '4,789', hot: false },
  { name: 'Boston', count: '3,456', hot: false }
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Enhanced Spacing */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <Badge className="mb-8 bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-base">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Job Search
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
              Find Your Dream Job
              <span className="block text-3xl md:text-4xl mt-4 text-blue-100 font-normal">
                in seconds, not hours
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
              Our AI analyzes millions of job postings to find perfect matches based on 
              your skills, experience, and preferences. Join 50,000+ professionals who've 
              found their next opportunity here.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl px-8 py-4 text-lg h-auto">
                <Link href="/search" className="group">
                  <Search className="mr-3 h-6 w-6" />
                  Start Your Search
                  <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm px-8 py-4 text-lg h-auto">
                <Link href="/dashboard">
                  <Briefcase className="mr-3 h-6 w-6" />
                  View Saved Jobs
                </Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 fill-current" />
                <span className="text-lg">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" />
                <span className="text-lg">50K+ Users</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-6 h-6" />
                <span className="text-lg">1M+ Jobs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Explore Popular Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover opportunities in trending job categories with thousands of active listings
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularCategories.map((category, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-gray-200 overflow-hidden hover:scale-105"
              >
                <CardHeader className="pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}>
                      <category.icon className="w-8 h-8 text-white" />
                    </div>
                    {category.trending && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-xl mb-3 group-hover:text-blue-600 transition-colors">
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-lg font-semibold text-gray-900 mb-4">
                    {category.count} active jobs
                  </CardDescription>
                  <Link href={`/search?query=${encodeURIComponent(category.query)}`}>
                    <Button variant="ghost" className="w-full justify-between group-hover:bg-gray-50 h-12">
                      Explore Opportunities
                      <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Locations Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Top Job Markets
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find opportunities in the world's most vibrant job markets and remote-first companies
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {topLocations.map((location, index) => (
              <Link
                key={index}
                href={`/search?location=${encodeURIComponent(location.name)}`}
                className="group"
              >
                <Card className="hover:shadow-xl transition-all duration-300 hover:scale-105 h-full">
                  <CardContent className="p-6 text-center h-full flex flex-col justify-center">
                    <MapPin className="w-8 h-8 mx-auto mb-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                      {location.name}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {location.count} jobs
                    </p>
                    {location.hot && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                        🔥 Hot Market
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Professionals Choose Us
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced features that give you the competitive edge in today's job market
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <Card className="border-2 hover:border-blue-500 transition-all duration-300 hover:shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">AI-Powered Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Our advanced AI analyzes job descriptions and scores them based on 
                  your profile for perfect matches. Get personalized recommendations 
                  with match scores from 1-10.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-blue-500 transition-all duration-300 hover:shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Rocket className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Real-Time Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Search across LinkedIn, Indeed, Glassdoor, and 50+ job boards 
                  simultaneously. Find fresh opportunities posted within the last 
                  30 days with our neural search technology.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-blue-500 transition-all duration-300 hover:shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Smart Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Get salary benchmarks, trending skills analysis, and market insights. 
                  Our validation ensures you only see real job postings, not outdated 
                  or filled positions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-3xl mx-auto">
            Join thousands of professionals who've found their dream jobs through 
            our AI-powered platform. Start your journey today.
          </p>
          <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl px-10 py-5 text-xl h-auto">
            <Link href="/search" className="group">
              Get Started Now
              <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}