import Wardrobe from './pages/Wardrobe';
import Studio from './pages/Studio';
import Gallery from './pages/Gallery';
import JewelryBox from './pages/JewelryBox';
import Closet from './pages/Closet';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Wardrobe": Wardrobe,
    "Studio": Studio,
    "Gallery": Gallery,
    "JewelryBox": JewelryBox,
    "Closet": Closet,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Wardrobe",
    Pages: PAGES,
    Layout: __Layout,
};