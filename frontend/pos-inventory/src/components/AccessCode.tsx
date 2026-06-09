// components/AccessCode.tsx (not pages/AccessCode.tsx)
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Security,
  VpnKey,
  Refresh,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning
} from '@mui/icons-material';

interface AccessCodeProps {
  isMobile: boolean;
}

const AccessCode: React.FC<AccessCodeProps> = ({ isMobile }) => {

  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNewCode, setShowNewCode] = useState(false);
  const [showConfirmCode, setShowConfirmCode] = useState(false);

  // Load current access code on component mount
  useEffect(() => {
    loadCurrentCode();
  }, []);

  const loadCurrentCode = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://abra-store-project.onrender.com/api/gatekeeper/code', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentCode(data.data.code || 'Not set');
        }
      }
    } catch (error) {
      console.error('Failed to load access code:', error);
      setCurrentCode('Error loading code');
    }
  };

  const handleUpdateCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a new access code' });
      return;
    }

    if (newCode !== confirmCode) {
      setMessage({ type: 'error', text: 'Access codes do not match' });
      return;
    }

    if (newCode.length < 4) {
      setMessage({ type: 'error', text: 'Access code must be at least 4 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://abra-store-project.onrender.com/api/gatekeeper/code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: newCode.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Access code updated successfully! All staff will need to use the new code.' 
        });
        setCurrentCode(newCode.trim());
        setNewCode('');
        setConfirmCode('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update access code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update access code. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(code);
    setConfirmCode(code);
  };

  return (
    <Box>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Security 
          sx={{ 
            fontSize: { xs: 48, sm: 64 }, 
            color: 'primary.main', 
            mb: 2 
          }} 
        />
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
          Access Code Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage the security code required to enter the pharmacy system
        </Typography>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Current Code Display */}
      <Card sx={{ mb: 4, bgcolor: 'grey.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Access Code
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
            <Typography 
              variant={isMobile ? "h6" : "h5"}
              sx={{ 
                fontFamily: 'monospace',
                bgcolor: 'white',
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300',
                flex: 1,
                textAlign: 'center'
              }}
            >
              {currentCode || 'Loading...'}
            </Typography>
            <Button
              onClick={loadCurrentCode}
              variant="outlined"
              startIcon={<Refresh />}
              fullWidth={isMobile}
            >
              Refresh
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This is the code that staff must enter to access the system.
          </Typography>
        </CardContent>
      </Card>

      {/* Update Code Form */}
      <Box component="form" onSubmit={handleUpdateCode}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Update Access Code
        </Typography>

        {/* Generate Random Code */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
          <Typography variant="body2" gutterBottom>
            Need a secure code? Generate one automatically:
          </Typography>
          <Button
            onClick={generateRandomCode}
            variant="outlined"
            startIcon={<VpnKey />}
            size="small"
          >
            Generate Secure Code
          </Button>
        </Box>

        {/* New Code Input */}
        <TextField
          fullWidth
          label="New Access Code"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          margin="normal"
          required
          type={showNewCode ? "text" : "password"}
          placeholder="Enter new access code"
          helperText="Minimum 4 characters. Make it easy for staff to remember."
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowNewCode(!showNewCode)}
                  edge="end"
                >
                  {showNewCode ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Confirm Code Input */}
        <TextField
          fullWidth
          label="Confirm Access Code"
          value={confirmCode}
          onChange={(e) => setConfirmCode(e.target.value)}
          margin="normal"
          required
          type={showConfirmCode ? "text" : "password"}
          placeholder="Confirm new access code"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowConfirmCode(!showConfirmCode)}
                  edge="end"
                >
                  {showConfirmCode ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Important Notice */}
        <Alert severity="warning" sx={{ mt: 2, mb: 3 }}>
          <Typography variant="body2">
            <strong>Important:</strong> When you change the access code, all staff will need to 
            use the new code immediately. Existing sessions will continue until the browser is closed.
          </Typography>
        </Alert>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading || !newCode.trim() || !confirmCode.trim()}
          sx={{
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Updating Code...' : 'Update Access Code'}
        </Button>
      </Box>

      {/* Instructions */}
      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>How it works:</strong><br/>
          • Staff must enter this code before accessing any part of the system<br/>
          • Code is stored per browser session (expires when browser closes)<br/>
          • Change the code only when security is compromised<br/>
          • Inform all staff immediately when changing the code
        </Typography>
      </Box>

      {/* Message Alert */}
      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mt: 2 }}
          icon={message.type === 'success' ? <CheckCircle /> : <Warning />}
        >
          {message.text}
        </Alert>
      )}
    </Box>
  );
};

export default AccessCode;