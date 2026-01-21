# Fix: 401 Unauthorized Error

## 🔍 The Problem

Your session token expired! That's why you're getting:
```
[ERROR] HTTP REQUEST FAILED
Status: 401 Unauthorized
Error: Invalid or expired session
```

## ✅ Quick Fix: Re-login

### Option 1: Simple Re-login
```
1. Logout from the system
2. Login again
3. Go back to certificate page
4. Try updating again
5. Should work now!
```

### Option 2: Refresh Token in Console
```javascript
// Open Console (F12) and run:
localStorage.getItem('auth_token');
// If it shows null or expired token, you need to login again
```

### Option 3: Check Token Expiry
```javascript
// In console:
const token = localStorage.getItem('auth_token');
console.log('Token exists:', !!token);
console.log('Token:', token);
// If token is there but expired, re-login
```

## 🎯 Why This Happened

JWT tokens expire after a certain time (usually 24 hours or less). When you try to:
- Create certificate → Works (token valid)
- Wait some time / refresh page
- Try to update → Fails (token expired)

## 🔧 The Real Fix

The system needs to:
1. Check if token is expired before API calls
2. Auto-refresh token or prompt re-login
3. Handle 401 errors gracefully

But for now, the quickest solution is to **re-login**!

---

## 🚀 Test After Re-login

1. **Logout** from the system
2. **Login** again (this creates new token)
3. **Go to certificate page**
4. **Load certificate for editing**
5. **Make changes**
6. **Click Update**
7. ✅ **Should work now!**

---

## 📊 Expected After Re-login

Console should show:
```
✅ Valid token
🔍 [DEBUG] Response status: 200 (not 401!)
✅ [SUCCESS] Updated certificate
```

---

**Re-login now and try again!** The update logic is working correctly, it's just the authentication token that expired. 🔐
