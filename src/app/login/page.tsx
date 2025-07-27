'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import type { Domain } from '@/types';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const LoginPage = () => {
  const router = useRouter();
  const { loginWithCredentials } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    domain: 'scei' as Domain
  });
  const [showPassword, setShowPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.domain) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Use the enhanced auth store method with domain validation
      await loginWithCredentials(formData.email, formData.password, formData.domain);
      
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Logo component that falls back to text if image not available
  const LoginLogo = ({ domain }: { domain: Domain }) => {
    const logoPath = domain === 'scei-he' 
      ? '/images/logos/scei-he-login-logo.png' 
      : '/images/logos/scei-login-logo.png';

    if (logoError) {
      return (
        <div className="w-32 h-32 bg-primary-800 rounded-xl flex items-center justify-center mx-auto shadow-lg">
          <span className="text-white font-bold text-3xl">
            {domain === 'scei-he' ? 'HE' : 'SC'}
          </span>
        </div>
      );
    }

    return (
      <div className="w-32 h-32 mx-auto bg-white rounded-xl shadow-lg p-4 flex items-center justify-center">
        <Image
          src={logoPath}
          alt={domain === 'scei-he' ? 'SCEI HE Logo' : 'SCEI Logo'}
          width={128}
          height={128}
          className="w-full h-full object-contain"
          onError={() => setLogoError(true)}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-6 pb-8">
          <LoginLogo domain={formData.domain} />
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formData.domain === 'scei-he' ? 'SCEI Higher Education' : 'Southern Cross Education Institute'}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account</p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Domain Selection */}
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Select
                value={formData.domain}
                onValueChange={(value: Domain) => {
                  handleInputChange('domain', value);
                  setLogoError(false); // Reset logo error when domain changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scei">SCEI</SelectItem>
                  <SelectItem value="scei-he">SCEI Higher Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Welcome to the Unit Management System</p>
            <p className="mt-1">
              {formData.domain === 'scei-he' ? 'SCEI Higher Education' : 'Southern Cross Education Institute'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;