// components/Gatekeeper.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Fade
} from '@mui/material';
import { Lock, LocalPharmacy, MedicalServices } from '@mui/icons-material';

const PHARMACY_BG = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80';

interface GatekeeperProps {
  children: React.ReactNode;
}

const Gatekeeper: React.FC<GatekeeperProps> = ({ children }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialCheck, setInitialCheck] = useState(true);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const storedCode = sessionStorage.getItem('gatekeeper_verified');
        if (storedCode === 'true') {
          setIsVerified(true);
        } else {
          setIsVerified(false);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        setIsVerified(false);
      } finally {
        setInitialCheck(false);
      }
    };

    checkVerificationStatus();
  }, []);

  const verifyCode = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://abra-store-project.onrender.com/api/gatekeeper/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const timeoutPromise = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const data = await Promise.race([response.json(), timeoutPromise]) as any;

      if (data.success) {
        sessionStorage.setItem('gatekeeper_verified', 'true');
        setIsVerified(true);
      } else {
        setError(data.error || 'Invalid access code');
        setIsVerified(false);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setError(error.message === 'Request timeout'
        ? 'Request timed out. Please check your connection and try again.'
        : 'Failed to verify code. Please try again.'
      );
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim()) {
      verifyCode(accessCode.trim());
    }
  };

  if (initialCheck || isVerified === null) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.92)), url("${PHARMACY_BG}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Fade in={true} timeout={800}>
          <Box sx={{ textAlign: 'center' }}>
            <MedicalServices
              sx={{
                fontSize: 80,
                color: '#2563EB',
                mb: 2,
                animation: 'bounce 2s infinite',
              }}
            />
            <CircularProgress
              size={60}
              thickness={4}
              sx={{
                color: '#2563EB',
                mb: 2
              }}
            />
            <Typography variant="h6" sx={{ color: '#1D4ED8', fontWeight: 'bold' }}>
              Preparing Airen Pharmacy System...
            </Typography>
            <Typography variant="body2" sx={{ color: '#3B82F6', mt: 1 }}>
              Your Pharmacy Store Management Solution
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  if (!isVerified) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `linear-gradient(rgba(0, 20, 80, 0.78), rgba(0, 20, 80, 0.78)), url("${PHARMACY_BG}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: 2,
        }}
      >
        <Fade in={true} timeout={500}>
          <Container maxWidth="sm">
            <Paper
              elevation={24}
              sx={{
                padding: 4,
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.97)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid #2563EB',
              }}
            >
              {loading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} sx={{ color: '#2563EB' }} />
                    <Typography variant="body2" sx={{ mt: 1, color: '#1D4ED8' }}>
                      Verifying access code...
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Header */}
              <Box sx={{ mb: 4 }}>
                <LocalPharmacy
                  sx={{
                    fontSize: 64,
                    color: '#2563EB',
                    mb: 2,
                    padding: 2,
                    backgroundColor: '#EFF6FF',
                    borderRadius: '50%',
                    border: '3px solid #BFDBFE',
                  }}
                />
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #1D4ED8, #3B82F6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Airen Pharmacy Access
                </Typography>
                <Typography variant="body1" color="#374151">
                  Enter the access code to continue to Airen Pharmacy Inventory System
                </Typography>
              </Box>

              {/* Access Code Form */}
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Store Access Code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  margin="normal"
                  required
                  type="password"
                  disabled={loading}
                  InputProps={{
                    startAdornment: <Lock sx={{ color: '#2563EB', mr: 1 }} />,
                  }}
                  placeholder="Enter the store access code"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2563EB',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#2563EB',
                    }
                  }}
                />

                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      mt: 2,
                      borderRadius: 2,
                      animation: 'fadeIn 0.3s ease-in',
                      backgroundColor: '#FFEBEE',
                      color: '#C62828',
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !accessCode.trim()}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #1D4ED8, #3B82F6)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1E3A8A, #2563EB)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                    },
                    position: 'relative',
                    minHeight: '48px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {loading ? (
                    <CircularProgress
                      size={24}
                      sx={{
                        color: 'white',
                        position: 'absolute',
                      }}
                    />
                  ) : (
                    <>
                      <LocalPharmacy sx={{ mr: 1 }} />
                      Continue to Airen Pharmacy
                    </>
                  )}
                </Button>
              </Box>

              {/* Decorative icons */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <MedicalServices sx={{ color: '#93C5FD', fontSize: 28 }} />
                <LocalPharmacy sx={{ color: '#2563EB', fontSize: 28 }} />
                <MedicalServices sx={{ color: '#6366F1', fontSize: 28 }} />
              </Box>

              {/* Instructions */}
              <Box sx={{
                mt: 4,
                p: 2,
                backgroundColor: '#EFF6FF',
                borderRadius: 2,
                borderLeft: '4px solid #2563EB',
              }}>
                <Typography variant="body2" color="#1D4ED8">
                  <strong>📋 Note:</strong> Contact the store manager or administrator if you don't have the access code.
                  This code ensures secure access to Airen Pharmacy's inventory and sales system.
                </Typography>
              </Box>

              {/* Footer */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E0E0E0' }}>
                <Typography variant="caption" color="#757575">
                  Airen Pharmacy Inventory System • Inventory Management • Version 1.0
                </Typography>
              </Box>
            </Paper>
          </Container>
        </Fade>

        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </Box>
    );
  }

  return <>{children}</>;
};

export default Gatekeeper;
