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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Job Search
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Find Your Dream Job
              <span className="block text-3xl md:text-4xl mt-2 text-blue-100 font-normal">
                in seconds, not hours
              </span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Our AI analyzes millions of job postings to find perfect matches based on 
              your skills, experience, and preferences. Join 50,000+ professionals who've 
              found their next opportunity here.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl">
                <Link href="/search" className="group">
                  <Search className="mr-2 h-5 w-5" />
                  Start Your Search
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
                <Link href="/dashboard">
                  <Briefcase className="mr-2 h-5 w-5" />
                  View Saved Jobs
                </Link>
              </Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-sm">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="text-sm">50K+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                <span className="text-sm">1M+ Jobs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      <section className="py-20 -mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore Popular Categories
            </h2>
            <p className="text-lg text-gray-600">
              Discover opportunities in trending job categories
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularCategories.map((category, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-gray-200 overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    {category.trending && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-xl mb-2 group-hover:text-blue-600 transition-colors">
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-lg font-semibold text-gray-900 mb-3">
                    {category.count} jobs
                  </CardDescription>
                  <Link href={`/search?query=${encodeURIComponent(category.query)}`}>
                    <Button variant="ghost" className="w-full justify-between group-hover:bg-gray-50">
                      Explore Jobs
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Locations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Top Job Locations
            </h2>
            <p className="text-lg text-gray-600">
              Find opportunities in the hottest job markets
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topLocations.map((location, index) => (
              <Link
                key={index}
                href={`/search?location=${encodeURIComponent(location.name)}`}
                className="group"
              >
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardContent className="p-4 text-center">
                    <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {location.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {location.count} jobs
                    </p>
                    {location.hot && (
                      <Badge className="mt-2 bg-orange-100 text-orange-700 border-orange-200">
                        🔥 Hot
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
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Professionals Choose Us
            </h2>
            <p className="text-lg text-gray-600">
              Advanced features that give you the edge in your job search
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">AI-Powered Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our advanced AI analyzes job descriptions and scores them based on 
                  your profile for perfect matches. Get personalized recommendations 
                  with match scores from 1-10.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Rocket className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Real-Time Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Search across LinkedIn, Indeed, Glassdoor, and 50+ job boards 
                  simultaneously. Find fresh opportunities posted within the last 
                  30 days with our neural search technology.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Award className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Filtering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Filter by salary, location, experience level, company size, and more. 
                  Our validation ensures you only see real job postings, not outdated 
                  or filled positions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of professionals who've accelerated their careers. 
            Start your AI-powered job search today and find opportunities you won't see anywhere else.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl">
              <Link href="/search" className="group">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
              <Link href="/dashboard">
                View Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}