# API Integration Guide

## 📁 File Structure

```
src/
  services/
    api.ts        # Service layer - semua API calls
    hooks.ts      # React hooks untuk mudah dipakai di components
  types.ts        # Type definitions (sudah updated sesuai database)
```

---

## 🚀 Cara Pakai

### **1. Service Layer (api.ts)**

Service layer mengelompokkan API calls berdasarkan domain:

- `authAPI` - Login, register, logout, update profile
- `userAPI` - Get users, approve/reject influencers
- `campaignAPI` - CRUD campaigns, manage influencers
- `escrowAPI` - Lock/release escrow, dispute
- `aiAPI` - Generate brief
- `systemLogsAPI` - Logging system actions

#### Contoh:

```typescript
import { campaignAPI } from '../services/api';

// Get semua campaigns
const campaigns = await campaignAPI.getAll();

// Get campaigns UMKM tertentu
const umkmCampaigns = await campaignAPI.getByUmkmId('umkm-id');

// Create campaign
const newCampaign = await campaignAPI.create({
  name: 'Promo Menu Baru',
  category: 'Food',
  description: '...',
  objective: 'Brand Awareness',
  audience: 'Millennials',
  platform: 'Instagram',
  tone: 'Casual',
  budget: 5000000,
});
```

---

### **2. React Hooks (hooks.ts)**

Hooks sudah menghandle loading state, error handling, dan automatic refetch. **Ini yang harus dipakai di components!**

#### **useAuth**

```typescript
import { useAuth } from '../services/hooks';

function LoginComponent() {
  const { user, loading, error, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome {user.name}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

#### **useCampaigns**

```typescript
import { useCampaigns } from '../services/hooks';

function CampaignsPage() {
  // Get semua campaigns
  const { campaigns, loading, error, createCampaign } = useCampaigns();

  // Atau get campaigns untuk UMKM tertentu:
  // const { campaigns, loading, error, createCampaign } = useCampaigns('umkm-id');

  const handleCreateCampaign = async () => {
    try {
      await createCampaign({
        name: 'New Campaign',
        category: 'Food',
        description: '...',
        objective: 'Brand Awareness',
        audience: 'Millennials',
        platform: 'TikTok',
        tone: 'Casual',
        budget: 5000000,
      });
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }
  };

  if (loading) return <div>Loading campaigns...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Campaigns ({campaigns.length})</h1>
      {campaigns.map((campaign) => (
        <div key={campaign.id}>
          <h3>{campaign.name}</h3>
          <p>Budget: Rp {campaign.budget}</p>
          <p>Status: {campaign.status}</p>
        </div>
      ))}
      <button onClick={handleCreateCampaign}>Create Campaign</button>
    </div>
  );
}
```

#### **useCampaignInfluencers**

```typescript
import { useCampaignInfluencers } from '../services/hooks';

function ManageInfluencersPage({ campaignId }: { campaignId: string }) {
  const {
    influencers,
    loading,
    addInfluencer,
    updateInfluencerStatus,
    submitContent,
  } = useCampaignInfluencers(campaignId);

  const handleAddInfluencer = async (influencerId: string) => {
    try {
      await addInfluencer(influencerId);
    } catch (err) {
      console.error('Failed to add influencer:', err);
    }
  };

  const handleApproveContent = async (influencerId: string) => {
    try {
      await updateInfluencerStatus(influencerId, 'brief_ready');
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div>
      <h2>Campaign Influencers</h2>
      {influencers.map((inf) => (
        <div key={inf.id}>
          <p>{inf.influencer_name} - {inf.status}</p>
          {inf.submission_url && <a href={inf.submission_url}>View Content</a>}
        </div>
      ))}
    </div>
  );
}
```

#### **useEscrow**

```typescript
import { useEscrow } from '../services/hooks';

function EscrowManagement() {
  const { escrows, loading, lock, release, dispute } = useEscrow();

  const handleLockEscrow = async () => {
    try {
      await lock('campaign-id', 'influencer-id', 5000000);
    } catch (err) {
      console.error('Failed to lock escrow:', err);
    }
  };

  return (
    <div>
      <h2>Escrow Transactions</h2>
      {/* Display escrows */}
      <button onClick={handleLockEscrow}>Lock Escrow</button>
    </div>
  );
}
```

#### **useUsers**

```typescript
import { useUsers } from '../services/hooks';

function InfluencersApprovalPage() {
  const { users, loading, approveInfluencer, rejectInfluencer } = useUsers('influencer');

  const handleApprove = async (influencerId: string) => {
    try {
      await approveInfluencer(influencerId);
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  return (
    <div>
      <h2>Influencer Approvals</h2>
      {users
        .filter((u) => !u.is_approved)
        .map((influencer) => (
          <div key={influencer.id}>
            <h3>{influencer.name}</h3>
            <button onClick={() => handleApprove(influencer.id)}>Approve</button>
            <button onClick={() => rejectInfluencer(influencer.id)}>Reject</button>
          </div>
        ))}
    </div>
  );
}
```

#### **useAI**

```typescript
import { useAI } from '../services/hooks';

function BriefGeneratorComponent() {
  const { brief, loading, error, generateBrief } = useAI();

  const handleGenerateBrief = async () => {
    try {
      await generateBrief({
        campaignName: 'Promo Menu Baru',
        objective: 'Brand Awareness',
        audience: 'Millennials',
        platform: 'TikTok',
        tone: 'Casual',
        brandName: 'Ayam Geprek',
        brandCategory: 'Food',
      });
    } catch (err) {
      console.error('Failed to generate brief:', err);
    }
  };

  return (
    <div>
      <button onClick={handleGenerateBrief} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Brief'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {brief && <div dangerouslySetInnerHTML={{ __html: brief }} />}
    </div>
  );
}
```

---

## 📋 Database Schema to API Mapping

### Users Table
```typescript
// Create (register)
POST /api/auth/register
Body: { email, password, name, role, brandName?, handle?, ... }

// Read
GET /api/users
GET /api/users/:userId
GET /api/users?role=influencer

// Update
PUT /api/auth/users/:userId
Body: { ...userData }

// Approve/Reject Influencer
POST /api/users/:influencerId/approve
POST /api/users/:influencerId/reject
```

### Campaigns Table
```typescript
// Create
POST /api/campaigns
Body: { name, category, description, objective, budget, ... }

// Read
GET /api/campaigns
GET /api/campaigns/:campaignId
GET /api/campaigns?umkm_id=xxx
GET /api/campaigns?status=active

// Update
PUT /api/campaigns/:campaignId
Body: { name?, status?, ... }

// Delete
DELETE /api/campaigns/:campaignId
```

### Campaign Influencers (M-to-M)
```typescript
// Add influencer to campaign
POST /api/campaigns/:campaignId/influencers
Body: { influencerId }

// Remove influencer
DELETE /api/campaigns/:campaignId/influencers/:influencerId

// Update status
PATCH /api/campaigns/:campaignId/influencers/:influencerId
Body: { status: 'invited' | 'brief_ready' | ... }

// Submit content
POST /api/campaigns/:campaignId/influencers/:influencerId/submit
Body: { submissionUrl }
```

### Escrow Transactions Table
```typescript
// Lock escrow
POST /api/escrow/lock
Body: { campaignId, influencerId, amount }

// Release escrow
POST /api/escrow/:escrowId/release

// Dispute escrow
POST /api/escrow/:escrowId/dispute
Body: { reason }

// Read
GET /api/escrow
GET /api/escrow/:escrowId
GET /api/escrow?campaign_id=xxx
```

### System Logs
```typescript
// Create log
POST /api/logs
Body: { action, details, actorType }

// Read logs
GET /api/logs
GET /api/logs?actor_id=xxx
```

---

## ⚠️ TODO untuk Production

1. **Authentication**: Setup JWT token di headers
   ```typescript
   const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
     const token = localStorage.getItem('token'); // Get dari storage
     const headers = {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`,
       ...options.headers,
     };
   ```

2. **Password Hashing**: Di server.ts, implement bcrypt untuk password:
   ```typescript
   import bcrypt from 'bcrypt';
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

3. **Error Handling**: Improve error messages dan validation

4. **Rate Limiting**: Tambah rate limiting di server

5. **Validation**: Server-side validation untuk semua input

6. **Environment Variables**: Update `.env.local` dengan API endpoints jika perlu

---

## 🧪 Test API dengan cURL atau Postman

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Create Campaign
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Promo",
    "category":"Food",
    "description":"...",
    "objective":"Brand Awareness",
    "audience":"Millennials",
    "platform":"TikTok",
    "tone":"Casual",
    "budget":5000000
  }'

# Get all campaigns
curl http://localhost:3000/api/campaigns
```

---

Semuanya sudah ready! Tinggal pakai hook-hook di components Anda!
