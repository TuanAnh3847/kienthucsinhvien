// Browser-only test double. Never loaded by the public site or sent to Firebase.
(() => {
    const options = window.__fixtureOptions || {};
    const state = window.__firebaseTest = { writes: [], listeners: {}, popupCalls: 0, signOutCalls: 0, options };
    const snap = value => ({ val: () => value, exists: () => value != null, forEach: fn => Object.entries(value || {}).forEach(([key,v]) => fn({ key, val: () => v })) });
    const authListeners = new Set();
    const auth = {
        currentUser: options.user || null,
        onAuthStateChanged(fn) { authListeners.add(fn); queueMicrotask(() => fn(auth.currentUser)); return () => authListeners.delete(fn); },
        async signInWithPopup() {
            state.popupCalls++;
            await new Promise(resolve => setTimeout(resolve, 30));
            if (options.popupError) throw { code: options.popupError, message: 'Test popup error' };
            const user = { uid: 'test-user', email: 'student@example.test', displayName: 'Sinh viên kiểm thử', photoURL: null };
            state.setUser(user);
            return { user };
        },
        async signOut() {
            state.signOutCalls++;
            if (options.signOutError) throw new Error('Test sign-out error');
            state.setUser(null);
        }
    };
    state.setUser = user => { auth.currentUser = user; for (const fn of authListeners) fn(user); };
    state.emit = (path, value) => { for (const fn of state.listeners[path] || []) fn(snap(value)); };
    state.authListenerCount = () => authListeners.size;
    const write = (path, value) => {
        state.writes.push({path,value});
        if (options.stallWrites) return new Promise(() => {});
        return options.writeError ? Promise.reject(new Error('Test write error')) : Promise.resolve();
    };
    const database = { ref: path => ({
        on(event, fn, errorFn) {
            (state.listeners[path] ||= new Set()).add(fn);
            if ((options.listenerErrorPaths || []).includes(path)) {
                queueMicrotask(() => errorFn?.(new Error('Test listener error')));
                return;
            }
            const value = path === '.info/connected' ? true : path === 'settings/online_counter' ? {isAutoMode:false,min:40,max:50} : null;
            queueMicrotask(() => fn(snap(value)));
        },
        off(event, fn) { state.listeners[path]?.delete(fn); },
        update: value => write(path,value), set: value => write(path,value), push: value => write(path,value), remove: () => write(path,null),
        once(event, fn) {
            if ((options.onceErrorPaths || []).includes(path)) return Promise.reject(new Error('Test read error'));
            const value = snap(null); if (fn) fn(value); return Promise.resolve(value);
        },
        onDisconnect: () => ({ update: value => write('disconnect:' + path,value), cancel: () => write('cancel:' + path,null) })
    }) };
    const firestore = { collection: path => ({
        orderBy: () => ({ get: async () => { if(options.cloudError) throw new Error('Test cloud error'); return {docs:[]}; } }),
        add: value => write(path,value)
    }) };
    const authFactory = () => auth;
    authFactory.GoogleAuthProvider = function () {};
    const firestoreFactory = () => firestore;
    firestoreFactory.FieldValue = { serverTimestamp: () => 'test-timestamp' };
    window.firebase = { apps: [], initializeApp(config) { this.apps.push({options:config}); }, auth: authFactory, database: () => database, firestore: firestoreFactory };
})();
