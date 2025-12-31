import AdminPartnerships from './pages/AdminPartnerships';
import BrandPartnerships from './pages/BrandPartnerships';
import Checkout from './pages/Checkout';
import Closet from './pages/Closet';
import CreatorOnboarding from './pages/CreatorOnboarding';
import Gallery from './pages/Gallery';
import JewelryBox from './pages/JewelryBox';
import Lookbook from './pages/Lookbook';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import SearchResults from './pages/SearchResults';
import ShopTheLook from './pages/ShopTheLook';
import Studio from './pages/Studio';
import StyleFeed from './pages/StyleFeed';
import StylistProfile from './pages/StylistProfile';
import Stylists from './pages/Stylists';
import Wardrobe from './pages/Wardrobe';
import Subscription from './pages/Subscription';
import CreatorDashboard from './pages/CreatorDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminPartnerships": AdminPartnerships,
    "BrandPartnerships": BrandPartnerships,
    "Checkout": Checkout,
    "Closet": Closet,
    "CreatorOnboarding": CreatorOnboarding,
    "Gallery": Gallery,
    "JewelryBox": JewelryBox,
    "Lookbook": Lookbook,
    "ProductDetail": ProductDetail,
    "Profile": Profile,
    "SearchResults": SearchResults,
    "ShopTheLook": ShopTheLook,
    "Studio": Studio,
    "StyleFeed": StyleFeed,
    "StylistProfile": StylistProfile,
    "Stylists": Stylists,
    "Wardrobe": Wardrobe,
    "Subscription": Subscription,
    "CreatorDashboard": CreatorDashboard,
}

export const pagesConfig = {
    mainPage: "Wardrobe",
    Pages: PAGES,
    Layout: __Layout,
};