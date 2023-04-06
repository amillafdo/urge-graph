import logo from './logo.svg';
import {Space} from 'antd';
import './App.css';
import SideMenu from './components/SideMenu';
import PageContent from './components/PageContent';
import AppFooter from './components/AppFooter';
import AppHeader from './components/AppHeader';

function App() {
  return (
    <div className="App">
      <AppHeader/>
      <div className="SideMenuAndPageContent">
        <SideMenu></SideMenu>
        <PageContent></PageContent>
      </div>
      <AppFooter/>
    </div>
  );
}

export default App;
