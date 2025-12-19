import Wardrobe from './pages/Wardrobe';
import Studio from './pages/Studio';
import Gallery from './pages/Gallery';
import JewelryBox from './pages/JewelryBox';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Wardrobe": Wardrobe,
    "Studio": Studio,
    "Gallery": Gallery,
    "JewelryBox": JewelryBox,
}

export const pagesConfig = {
    mainPage: "Wardrobe",
    Pages: PAGES,
    Layout: __Layout,
};