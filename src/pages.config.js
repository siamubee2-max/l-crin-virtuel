import Wardrobe from './pages/Wardrobe';
import Studio from './pages/Studio';
import Gallery from './pages/Gallery';
import JewelryBox from './pages/JewelryBox';
import Closet from './pages/Closet';
import Profile from './pages/Profile';
import StyleFeed from './pages/StyleFeed';
import Orders from './pages/Orders';
import AdminOrders from './pages/AdminOrders';
import Checkout from './pages/Checkout';
import Shop from './pages/Shop';
import MoniImporter from './pages/MoniImporter';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Wardrobe": Wardrobe,
    "Studio": Studio,
    "Gallery": Gallery,
    "JewelryBox": JewelryBox,
    "Closet": Closet,
    "Profile": Profile,
    "StyleFeed": StyleFeed,
    "Orders": Orders,
    "AdminOrders": AdminOrders,
    "Checkout": Checkout,
    "Shop": Shop,
    "MoniImporter": MoniImporter,
}

export const pagesConfig = {
    mainPage: "Wardrobe",
    Pages: PAGES,
    Layout: __Layout,
};