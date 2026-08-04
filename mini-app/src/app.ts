import { PropsWithChildren, useEffect } from 'react';
import { useUserStore } from './stores/user';
import { fetchMe } from './services/auth';
import './app.scss';
import './styles/common.scss';

function App({ children }: PropsWithChildren) {
  const token = useUserStore((s) => s.token);
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    if (!token) return;
    fetchMe()
      .then((me: any) => {
        setUser({
          id: me.id,
          nickname: me.nickname,
          avatar: me.avatar,
          roles: me.roles || [],
          phoneMask: me.phoneMask,
          legalVersion: me.legalVersion,
        });
      })
      .catch(() => undefined);
  }, [token, setUser]);

  return children;
}

export default App;
