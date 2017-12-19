var list = [
    {  
        img:"images/index/goods01.jpg",
        name: "意凡特",
        title:"健身运动背心女士跑步活动",
        price:"135",
        beforPrice:"130",
        
    },
    {   
        img:"images/index/goods01.jpg",
        name: "意凡特",
        title:"健身运动背心女士跑步活动",
        price:"135",
        beforPrice:"130", 
    },
    {  
        img:"images/index/goods01.jpg",
        name: "意凡特",
        title:"健身运动背心女士跑步活动",
        price:"135",
        beforPrice:"130",
        
    },
    {   
        img:"images/index/goods01.jpg",
        name: "意凡特",
        title:"健身运动背心女士跑步活动",
        price:"135",
        beforPrice:"130", 
    }
];

var add=[
    {img:"images/index/nav_add01.jpg"},
    {img:"images/index/nav_add02.jpg"},
    {img:"images/index/nav_add03.jpg"},
    {img:"images/index/nav_add04.jpg"},
];

var title =[
    {title:"滑雪装备",img:"images/index/nav_icon01.png"},
    {title:"热门推荐",img:"images/index/nav_icon02.png"},
    {title:"新品集结",img:"images/index/nav_icon03.png"},
    {title:"领券中心",img:"images/index/nav_icon04.png"},
];

var icon =[
    {img:"images/index/brand01.jpg"},
    {img:"images/index/brand02.jpg"},
    {img:"images/index/brand03.jpg"},
    {img:"images/index/brand04.jpg"},
    {img:"images/index/brand05.jpg"},
    {img:"images/index/brand06.jpg"},
    {img:"images/index/brand07.jpg"},
    {img:"images/index/brand08.jpg"},
]

var vm = new Vue({
    el: "#app",
    data: {
        title:title,
        list:list,
        add:add,
    },

});
